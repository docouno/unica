# Managed component registration.
DEVKIT_REGISTERED_APPS := playground
DEVKIT_REGISTERED_PACKAGES := ui
DEVKIT_DESKTOP_APPS := 
DEVKIT_PACKAGEABLE_PACKAGES := ui
setup-playground: setup-node-workspace
check-playground: check/packages/ui build/packages/ui
test-playground: build/packages/ui
build-playground: build/packages/ui
dev-playground: build/packages/ui
setup/packages/ui: setup-node-workspace
package/packages/ui: build/packages/ui
