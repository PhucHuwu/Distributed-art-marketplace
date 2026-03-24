#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost}"

check_endpoint() {
  local name="$1"
  local path="$2"

  echo "Checking ${name}: ${BASE_URL}${path}"
  if curl -fsS "${BASE_URL}${path}" >/dev/null; then
    echo "PASS ${name}"
  else
    echo "FAIL ${name}"
    return 1
  fi
}

check_endpoint "gateway health" "/health"

check_endpoint "auth health via gateway" "/api/auth/health"
check_endpoint "auth docs via gateway" "/api/auth/docs"
check_endpoint "auth openapi via gateway" "/api/auth/openapi.json"

check_endpoint "users health via gateway" "/api/users/health"
check_endpoint "users docs via gateway" "/api/users/docs"
check_endpoint "users openapi via gateway" "/api/users/openapi.json"

check_endpoint "catalog health via gateway" "/api/catalog/health"
check_endpoint "catalog docs via gateway" "/api/catalog/docs"
check_endpoint "catalog openapi via gateway" "/api/catalog/openapi.json"

check_endpoint "inventory health via gateway" "/api/inventory/health"
check_endpoint "inventory docs via gateway" "/api/inventory/docs"
check_endpoint "inventory openapi via gateway" "/api/inventory/openapi.json"

check_endpoint "orders health via gateway" "/api/orders/health"
check_endpoint "orders docs via gateway" "/api/orders/docs"
check_endpoint "orders openapi via gateway" "/api/orders/openapi.json"

check_endpoint "payments health via gateway" "/api/payments/health"
check_endpoint "payments docs via gateway" "/api/payments/docs"
check_endpoint "payments openapi via gateway" "/api/payments/openapi.json"

check_endpoint "notifications health via gateway" "/api/notifications/health"
check_endpoint "notifications docs via gateway" "/api/notifications/docs"
check_endpoint "notifications openapi via gateway" "/api/notifications/openapi.json"

check_endpoint "audit health via gateway" "/api/admin/audit-logs/health"
check_endpoint "audit docs via gateway" "/api/admin/audit-logs/docs"
check_endpoint "audit openapi via gateway" "/api/admin/audit-logs/openapi.json"

echo "Smoke checks completed successfully."
