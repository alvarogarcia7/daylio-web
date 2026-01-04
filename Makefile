PLAYWRIGHT?=npx playwright
PLAYWRIGHT_WORKERS?=4
PLAYWRIGHT_TEST?=${PLAYWRIGHT} test --workers ${PLAYWRIGHT_WORKERS}
# Help target - shows available commands
help:
	@echo "Available Makefile targets:"
	@echo ""
	@echo "  make test                     - Run all test suites sequentially"
	@echo "  make test-unit                - Run unit tests"
	@echo "  make test-integration         - Run integration tests"
	@echo "  make test-e2e                 - Run e2e tests (server kept running)"
	@echo ""
	@echo "  make test-playwright          - Run Playwright tests (no server kept running)"
	@echo "  make test-playwright-file FILE=<path> - Run specific test file"
	@echo "  make test-playwright-project PROJECT=<name> - Run tests for specific browser"
	@echo "  make test-playwright-ui       - Run Playwright tests in UI mode"
	@echo "  make test-playwright-headed   - Run Playwright tests in headed mode"
	@echo ""
	@echo "  make test-data-generate       - Generate test data"
	@echo "  make dev                      - Run development server"
	@echo ""
	@echo "Examples:"
	@echo "  make test-playwright-file FILE=e2e/tests/dashboard.spec.js"
	@echo "  make test-playwright-project PROJECT=chromium"
.PHONY: help

# Run all test suites sequentially
test: test-unit test-integration test-e2e
.PHONY: test

# Run unit tests
test-unit:
	npm run test:unit
.PHONY: test-unit

test-data-generate:
	node e2e/fixtures/create-test-backup.js
	mv e2e/fixtures/test-backup.daylio data/backup.daylio
.PHONY: test-data-generate

# Run integration tests
test-integration:
	npm run test:integration
.PHONY: test-integration

# Run end-to-end tests (with server kept running by Playwright)
test-e2e:
	npm run test:e2e
.PHONY: test-e2e

run:
	npx nodemon server.js
.PHONY: run

set-fixture-1:
	rm -f ./data/daylio.db*
	node e2e/fixtures/create-test-backup.js
	mv e2e/fixtures/test-backup.daylio data/backup.daylio
	npx node server.js data/backup.daylio
.PHONY: set-fixture-1

# Run Playwright tests without keeping server running (for CI/automation)
test-playwright: set-fixture-1
	CI=1 ${PLAYWRIGHT_TEST}
.PHONY: test-playwright

# Run specific Playwright test file without keeping server running
test-playwright-file:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make test-playwright-file FILE=<test-file-path>"; \
		echo "Example: make test-playwright-file FILE=e2e/tests/dashboard.spec.js"; \
		exit 1; \
	fi
	CI=1 ${PLAYWRIGHT_TEST} $(FILE)
.PHONY: test-playwright-file

# Run Playwright tests for specific project without keeping server running
test-playwright-project:
	@if [ -z "$(PROJECT)" ]; then \
		echo "Usage: make test-playwright-project PROJECT=<project-name>"; \
		echo "Example: make test-playwright-project PROJECT=chromium"; \
		exit 1; \
	fi
	CI=1 ${PLAYWRIGHT_TEST} --project=$(PROJECT)
.PHONY: test-playwright-project

# Run Playwright tests with UI mode (interactive)
test-playwright-ui:
	${PLAYWRIGHT_TEST} --ui
.PHONY: test-playwright-ui

# Run Playwright tests in headed mode (see browser)
test-playwright-headed:
	CI=1 ${PLAYWRIGHT_TEST} --headed
.PHONY: test-playwright-headed

test-playwright-report:
	${PLAYWRIGHT} show-report
.PHONY: test-playwright-report

# Run the development server
dev:
	npm start
.PHONY: dev

# Default target - show help
.DEFAULT_GOAL := help

# All tests
all: test
.PHONY: all
