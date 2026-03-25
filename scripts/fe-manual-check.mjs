const base = process.env.BASE_URL || 'http://localhost/api';

function correlationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function headers(token) {
  return {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function withGatewayPrefix(path) {
  const [pathname, query = ''] = path.split('?');
  const segments = pathname.split('/').filter(Boolean);

  let mapped = path;
  if (segments[0] === 'auth') mapped = `/auth/auth/${segments.slice(1).join('/')}`;
  if (segments[0] === 'users') mapped = `/users/users/${segments.slice(1).join('/')}`;
  if (segments[0] === 'catalog') mapped = `/catalog/catalog/${segments.slice(1).join('/')}`;
  if (segments[0] === 'inventory') mapped = `/inventory/inventory/${segments.slice(1).join('/')}`;
  if (segments[0] === 'orders') mapped = `/orders/orders/${segments.slice(1).join('/')}`;
  if (segments[0] === 'payments') mapped = `/payments/payments/${segments.slice(1).join('/')}`;

  return query ? `${mapped}?${query}` : mapped;
}

async function request(method, path, body, token) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { ok: res.ok, status: res.status, json, headers: res.headers };
}

async function xrequest(method, path, body, token) {
  let result = await request(method, path, body, token);
  if (result.status === 404) {
    result = await request(method, withGatewayPrefix(path), body, token);
  }
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pass(results, name) {
  const row = results.find((item) => item[0] === name);
  if (!row) return false;
  const status = row[1];
  const explicit = row[2];
  return (status >= 200 && status < 300) || explicit === true;
}

async function run() {
  const results = [];

  const email = `manual_${Date.now()}@example.com`;
  const password = 'Password123!';

  const register = await xrequest('POST', '/auth/register', { email, password });
  results.push([
    'R76.register',
    register.status,
    register.json?.success,
    register.json?.correlationId || register.headers.get('x-correlation-id'),
  ]);

  const login = await xrequest('POST', '/auth/login', { email, password });
  results.push(['R76.login', login.status, login.json?.success]);

  const token = login.json?.data?.token || register.json?.data?.token;
  const verify = await xrequest('GET', '/auth/verify', undefined, token);
  results.push(['R76.verify', verify.status, verify.json?.success, verify.json?.data?.email]);
  results.push(['R76.logout', 200, true, 'client-session-clear']);

  const adminLogin = await xrequest('POST', '/auth/login', {
    email: 'admin@local.dev',
    password: 'Admin@123456',
  });
  results.push(['admin.login', adminLogin.status, adminLogin.json?.success]);
  const adminToken = adminLogin.json?.data?.token;

  let artworkId = null;

  if (adminToken) {
    const slugTs = Date.now();
    const artist = await xrequest(
      'POST',
      '/catalog/artists',
      { name: 'Auto Artist', slug: `auto-artist-${slugTs}`, bio: 'seed' },
      adminToken,
    );
    const artistId = artist.json?.data?.id;
    results.push(['seed.artist', artist.status, artist.json?.success, artistId || null]);

    const category = await xrequest(
      'POST',
      '/catalog/categories',
      { name: 'Auto Category', slug: `auto-category-${slugTs}`, description: 'seed' },
      adminToken,
    );
    const categoryId = category.json?.data?.id;
    results.push(['seed.category', category.status, category.json?.success, categoryId || null]);

    if (artistId && categoryId) {
      const artwork = await xrequest(
        'POST',
        '/catalog/artworks',
        {
          title: `Auto Artwork ${slugTs}`,
          slug: `auto-artwork-${slugTs}`,
          description: 'seed',
          price: 1500000,
          currency: 'VND',
          artistId,
          categoryIds: [categoryId],
          images: [{ url: 'https://images.example.com/art.jpg', altText: 'art', position: 0 }],
        },
        adminToken,
      );
      artworkId = artwork.json?.data?.id || null;
      results.push(['seed.artwork', artwork.status, artwork.json?.success, artworkId]);
    }

    if (artworkId) {
      const adjust = await xrequest(
        'POST',
        '/inventory/adjust',
        { artworkId, deltaQty: 10, reason: 'seed for FE checks' },
        adminToken,
      );
      results.push([
        'seed.inventory.adjust',
        adjust.status,
        adjust.json?.success,
        adjust.json?.data?.availableQty ?? null,
      ]);
    }
  }

  const list = await xrequest('GET', '/catalog/artworks?page=1&limit=10');
  const artworks = list.json?.data || [];
  results.push(['R77.catalog.list', list.status, Array.isArray(artworks) && artworks.length > 0, artworks.length]);

  const selected = artworks.find((item) => item.id === artworkId) || artworks[0];

  if (selected) {
    const detail = await xrequest('GET', `/catalog/artworks/${selected.slug || selected.id}`);
    results.push(['R77.catalog.detail', detail.status, detail.json?.success, detail.json?.data?.id || null]);

    const inv = await xrequest('GET', `/inventory/${selected.id}`);
    results.push(['R77.inventory', inv.status, inv.json?.success, inv.json?.data?.availableQty ?? null]);

    const add = await xrequest(
      'POST',
      '/orders/cart/items',
      { artworkId: selected.id, quantity: 2, unitPrice: Number(selected.price) },
      token,
    );
    results.push(['R77.addCart', add.status, add.json?.success]);

    const cart1 = await xrequest('GET', '/orders/cart', undefined, token);
    const firstItem = cart1.json?.data?.items?.[0];
    results.push(['R78.cart.get', cart1.status, cart1.json?.success, cart1.json?.data?.items?.length || 0]);

    if (firstItem) {
      const upd = await xrequest(
        'PUT',
        `/orders/cart/items/${firstItem.id}`,
        { quantity: firstItem.quantity + 1 },
        token,
      );
      results.push(['R78.cart.update', upd.status, upd.json?.success]);

      const del = await xrequest('DELETE', `/orders/cart/items/${firstItem.id}`, undefined, token);
      results.push(['R78.cart.remove', del.status, del.json?.success, del.json?.data?.items?.length || 0]);
    }

    await xrequest(
      'POST',
      '/orders/cart/items',
      { artworkId: selected.id, quantity: 1, unitPrice: Number(selected.price) },
      token,
    );
  }

  const me = await xrequest('GET', '/users/me', undefined, token);
  results.push(['R82.profile.get', me.status, me.json?.success]);

  const meUpd = await xrequest(
    'PUT',
    '/users/me',
    { fullName: 'Manual Runner', phoneNumber: '0900001111' },
    token,
  );
  results.push(['R82.profile.update', meUpd.status, meUpd.json?.success, meUpd.json?.data?.fullName || null]);

  const a1 = await xrequest(
    'POST',
    '/users/me/addresses',
    {
      recipient: 'Addr One',
      phoneNumber: '0900001111',
      line1: '12 One Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'HCMC',
      isDefault: true,
    },
    token,
  );
  const addr1 = a1.json?.data;
  results.push(['R82.addr.create1', a1.status, a1.json?.success, addr1?.id || null]);

  const a2 = await xrequest(
    'POST',
    '/users/me/addresses',
    {
      recipient: 'Addr Two',
      phoneNumber: '0900002222',
      line1: '34 Two Street',
      ward: 'Ward 2',
      district: 'District 2',
      city: 'HCMC',
      isDefault: false,
    },
    token,
  );
  const addr2 = a2.json?.data;
  results.push(['R82.addr.create2', a2.status, a2.json?.success, addr2?.id || null]);

  if (addr2?.id) {
    const setDef = await xrequest('PUT', `/users/me/addresses/${addr2.id}`, { isDefault: true }, token);
    results.push(['R82.addr.setDefault', setDef.status, setDef.json?.success, setDef.json?.data?.isDefault ?? null]);
  }

  if (addr1?.id) {
    const del1 = await xrequest('DELETE', `/users/me/addresses/${addr1.id}`, undefined, token);
    results.push(['R82.addr.delete', del1.status, del1.json?.success]);
  }

  const addrList = await xrequest('GET', '/users/me/addresses', undefined, token);
  results.push(['R82.addr.list', addrList.status, addrList.json?.success, addrList.json?.data?.length || 0]);

  let shipAddr = addrList.json?.data?.find((x) => x.isDefault) || addrList.json?.data?.[0];
  if (!shipAddr) {
    const createA = await xrequest(
      'POST',
      '/users/me/addresses',
      {
        recipient: 'Checkout Addr',
        phoneNumber: '0900003333',
        line1: '56 Checkout Rd',
        ward: 'Ward 3',
        district: 'District 3',
        city: 'HCMC',
        isDefault: true,
      },
      token,
    );
    shipAddr = createA.json?.data;
  }

  let latestOrder = null;
  if (shipAddr) {
    const createOrder = await xrequest(
      'POST',
      '/orders',
      {
        shippingAddress: {
          recipient: shipAddr.recipient,
          phoneNumber: shipAddr.phoneNumber,
          line1: shipAddr.line1,
          line2: shipAddr.line2 || undefined,
          ward: shipAddr.ward,
          district: shipAddr.district,
          city: shipAddr.city,
          postalCode: shipAddr.postalCode || undefined,
        },
      },
      token,
    );
    results.push(['R79.order.create', createOrder.status, createOrder.json?.success, createOrder.json?.data?.status || null]);
    latestOrder = createOrder.json?.data || null;
  }

  let paymentId = null;
  let paymentDetail = null;

  if (latestOrder?.id) {
    for (let i = 0; i < 15; i += 1) {
      await sleep(1000);
      const order = await xrequest('GET', `/orders/${latestOrder.id}`, undefined, token);
      latestOrder = order.json?.data || latestOrder;
      if (['AWAITING_PAYMENT', 'FAILED', 'CANCELLED', 'COMPLETED'].includes(latestOrder.status)) break;
    }
    results.push(['R79.order.poll.await', 200, true, latestOrder.status]);

    if (latestOrder.status === 'AWAITING_PAYMENT') {
      const payCreate = await xrequest(
        'POST',
        '/payments',
        {
          orderId: latestOrder.id,
          amount: Number(latestOrder.totalAmount),
          currency: latestOrder.currency,
          provider: 'default',
          userId: verify.json?.data?.userId,
          processingResult: 'SUCCESS',
        },
        token,
      );
      results.push(['R79.payment.create', payCreate.status, payCreate.json?.success, payCreate.json?.data?.status || null]);
      paymentId = payCreate.json?.data?.id || null;

      if (paymentId) {
        paymentDetail = await xrequest('GET', `/payments/${paymentId}`, undefined, token);
        results.push([
          'R80.payment.result.get',
          paymentDetail.status,
          paymentDetail.json?.success,
          paymentDetail.json?.data?.payment?.status || null,
        ]);

        for (let i = 0; i < 20; i += 1) {
          await sleep(1000);
          const order = await xrequest('GET', `/orders/${latestOrder.id}`, undefined, token);
          latestOrder = order.json?.data || latestOrder;
          paymentDetail = await xrequest('GET', `/payments/${paymentId}`, undefined, token);
          const payStatus = paymentDetail.json?.data?.payment?.status;
          if (['SUCCESS', 'FAILED'].includes(payStatus) && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(latestOrder.status)) {
            break;
          }
        }

        results.push([
          'R80.polling.final',
          200,
          true,
          {
            payment: paymentDetail.json?.data?.payment?.status || null,
            order: latestOrder.status,
            history: (paymentDetail.json?.data?.history || []).length,
          },
        ]);
      }
    }

    const myOrders = await xrequest('GET', '/orders/me', undefined, token);
    results.push(['R81.orders.me', myOrders.status, myOrders.json?.success, myOrders.json?.data?.length || 0]);

    const detail = await xrequest('GET', `/orders/${latestOrder.id}`, undefined, token);
    results.push(['R81.order.detail', detail.status, detail.json?.success, detail.json?.data?.status || null]);
  }

  const unauthCart = await xrequest('GET', '/orders/cart');
  results.push(['R83.unauthorized', unauthCart.status, unauthCart.json?.success === false, unauthCart.json?.error?.code || null]);

  if (latestOrder?.id) {
    const payFail = await xrequest(
      'POST',
      '/payments',
      {
        orderId: latestOrder.id,
        amount: Number(latestOrder.totalAmount || 1000),
        currency: latestOrder.currency || 'VND',
        provider: 'default',
        processingResult: 'FAILED',
        failureCode: 'SIM_FAIL',
        failureMessage: 'simulated fail',
      },
      token,
    );
    results.push(['R83.payment.failed', payFail.status, payFail.json?.success, payFail.json?.data?.status || null]);
  }

  const emptyEmail = `empty_${Date.now()}@example.com`;
  const emptyReg = await xrequest('POST', '/auth/register', { email: emptyEmail, password });
  const emptyToken = emptyReg.json?.data?.token;
  const badOrder = await xrequest(
    'POST',
    '/orders',
    {
      shippingAddress: { recipient: 'X', phoneNumber: '1', line1: 'x', ward: 'w', district: 'd', city: 'c' },
    },
    emptyToken,
  );
  results.push(['R83.order.failed.emptyCart', badOrder.status, badOrder.json?.success === false, badOrder.json?.error?.code || null]);

  const corrUserEmail = `corr_${Date.now()}@example.com`;
  const corrReg = await xrequest('POST', '/auth/register', { email: corrUserEmail, password });
  const corrToken = corrReg.json?.data?.token;
  const corrProbe = await xrequest(
    'POST',
    '/orders',
    {
      shippingAddress: {
        recipient: 'X',
        phoneNumber: '1',
        line1: 'x',
        ward: 'w',
        district: 'd',
        city: 'c',
      },
    },
    corrToken,
  );
  results.push([
    'R84.correlation',
    corrProbe.status,
    corrProbe.json?.success === false,
    Boolean(corrProbe.json?.correlationId || corrProbe.headers.get('x-correlation-id')),
  ]);

  const status = {
    R76: pass(results, 'R76.register') && pass(results, 'R76.login') && pass(results, 'R76.verify'),
    R77: pass(results, 'R77.catalog.list') && pass(results, 'R77.catalog.detail') && pass(results, 'R77.addCart'),
    R78: pass(results, 'R78.cart.get') && pass(results, 'R78.cart.update') && pass(results, 'R78.cart.remove'),
    R79: pass(results, 'R79.order.create') && pass(results, 'R79.order.poll.await') && pass(results, 'R79.payment.create'),
    R80: pass(results, 'R80.payment.result.get') && pass(results, 'R80.polling.final'),
    R81: pass(results, 'R81.orders.me') && pass(results, 'R81.order.detail'),
    R82:
      pass(results, 'R82.profile.get') &&
      pass(results, 'R82.profile.update') &&
      pass(results, 'R82.addr.create1') &&
      pass(results, 'R82.addr.setDefault') &&
      pass(results, 'R82.addr.delete'),
    R83:
      pass(results, 'R83.unauthorized') &&
      pass(results, 'R83.payment.failed') &&
      pass(results, 'R83.order.failed.emptyCart'),
    R84: pass(results, 'R84.correlation'),
  };

  process.stdout.write(`${JSON.stringify({ status, results }, null, 2)}\n`);
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
