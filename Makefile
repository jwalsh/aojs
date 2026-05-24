# aojs Makefile
# Autonomous Observability in JavaScript

# Variables
NODE := node
NPM := npm
DIST_DIR := dist
SRC_DIR := src
TEST_DIR := test

# Default target
.PHONY: all
all: clean install build test

# Install dependencies
.PHONY: install
install:
	@echo "Installing dependencies..."
	$(NPM) install

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(DIST_DIR)
	rm -rf node_modules

# Build the project
.PHONY: build
build:
	@echo "Building aojs..."
	$(NODE) build.js

# Run tests
.PHONY: test
test: build fixtures
	@echo "Running tests..."
	$(NODE) --test $(TEST_DIR)/*.test.js

# Run linting
.PHONY: lint
lint:
	@echo "Running ESLint..."
	$(NPM) run lint

# Run the application (example usage)
.PHONY: run
run: build
	@echo "Running example..."
	@$(NODE) -e "import ao from './dist/index.js'; console.log(ao.analyze('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'));"

# Analyze sample access logs
.PHONY: analyze
analyze: build
	@echo "Analyzing sample access logs..."
	@$(NODE) dist/log-analyzer.js data/sample_access.log

# Development mode - watch for changes and rebuild
.PHONY: dev
dev:
	@echo "Starting development mode..."
	@echo "Watching for changes in $(SRC_DIR)..."
	@while true; do \
		$(MAKE) build; \
		echo "Waiting for changes..."; \
		sleep 2; \
	done

# Check Node.js version
.PHONY: check-node
check-node:
	@echo "Checking Node.js version..."
	@$(NODE) -v
	@echo "Required: >=18.0.0"

# Release targets (tag-based: pushing a v* tag triggers CI publish)
.PHONY: release-patch release-minor release-major release-hotfix
release-patch: test
	@echo "Releasing patch..."
	$(NPM) version patch -m "chore: release %s"
	git push && git push --tags

release-minor: test
	@echo "Releasing minor..."
	$(NPM) version minor -m "feat: release %s"
	git push && git push --tags

release-major: test
	@echo "Releasing major..."
	$(NPM) version major -m "feat!: release %s"
	git push && git push --tags

# Emergency local publish (requires OTP)
release-hotfix: test
	@echo "Publishing hotfix locally..."
	@echo "Run: npm publish --access public --otp=XXXXXX"

# Deprecate a version (usage: make deprecate VERSION=1.1.1 MSG="use 1.1.3")
.PHONY: deprecate
deprecate:
	@test -n "$(VERSION)" || (echo "Usage: make deprecate VERSION=x.y.z MSG='reason'" && exit 1)
	npm deprecate ao@$(VERSION) "$(MSG)"

# Rollback latest to a specific version
.PHONY: rollback
rollback:
	@test -n "$(VERSION)" || (echo "Usage: make rollback VERSION=x.y.z" && exit 1)
	npm dist-tag add ao@$(VERSION) latest
	npm view ao dist-tags

# View current registry state
.PHONY: registry-status
registry-status:
	@echo "=== Dist Tags ==="
	@npm view ao dist-tags --json
	@echo "\n=== All Versions ==="
	@npm view ao versions --json
	@echo "\n=== Latest ==="
	@npm view ao version

# External test fixtures (file targets — only download when missing)
test/fixtures/crawler-user-agents.json:
	@mkdir -p test/fixtures
	curl -sL https://raw.githubusercontent.com/monperrus/crawler-user-agents/master/crawler-user-agents.json -o $@

test/fixtures/ai-robots-txt.json:
	@mkdir -p test/fixtures
	curl -sL https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json -o $@

.PHONY: fixtures
fixtures: test/fixtures/crawler-user-agents.json test/fixtures/ai-robots-txt.json
	@echo "✓ Fixtures up to date"

# Force re-download
.PHONY: fixtures-refresh
fixtures-refresh:
	rm -f test/fixtures/crawler-user-agents.json test/fixtures/ai-robots-txt.json
	$(MAKE) fixtures

# Help target
.PHONY: help
help:
	@echo "aojs - Autonomous Observability in JavaScript"
	@echo ""
	@echo "Available targets:"
	@echo "  make install    - Install dependencies"
	@echo "  make build      - Build the project"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run ESLint"
	@echo "  make run        - Run example usage"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make dev        - Start development mode"
	@echo "  make check-node - Check Node.js version"
	@echo "  make help       - Show this help message"
	@echo ""
	@echo ""
	@echo "Release targets:"
	@echo "  make release-patch   - Bump patch, push (CI publishes)"
	@echo "  make release-minor   - Bump minor, push (CI publishes)"
	@echo "  make release-major   - Bump major, push (CI publishes)"
	@echo "  make release-hotfix  - Build for local emergency publish"
	@echo "  make deprecate VERSION=x.y.z MSG='reason'"
	@echo "  make rollback VERSION=x.y.z"
	@echo "  make registry-status - View npm dist-tags and versions"
	@echo ""
	@echo "Common workflows:"
	@echo "  make            - Clean, install, build, and test"
	@echo "  make build test - Build and run tests"