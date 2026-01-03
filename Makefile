# Run all test suites sequentially
test: test-unit test-integration test-e2e
.PHONY: test

# Run unit tests
test-unit:
	npm run test:unit
.PHONY: test-unit

# Run integration tests
test-integration:
	npm run test:integration
.PHONY: test-integration

# Run end-to-end tests
test-e2e:
	npm run test:e2e
.PHONY: test-e2e

# Run the development server
dev:
	npm start
.PHONY: dev

# Default target
all: test
.PHONY: all
