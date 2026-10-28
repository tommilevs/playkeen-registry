# Unixplay package format

Every public application repository should be named `keenplay-<id>` and contain a root `unixplay.yaml`. Public installation uses only assets published in a GitHub Release, never an arbitrary branch script.

Required manifest fields:

```yaml
schema: playkeen/v1
id: my-app
name: My App
version: 1.0.0
type: bash # bash, opkg or hybrid
architectures: [arm64, armv7]
```

For `type: opkg`, Unixplay delegates lifecycle behavior to Entware. The package itself defines installation, removal, dependencies, init scripts and autostart. An opkg manifest only needs package metadata, for example:

```yaml
schema: playkeen/v1
id: transmission
name: Transmission
version: 4.0.6
type: opkg
architectures: [arm64, armv7]
package_name: transmission-daemon
package_file: transmission-daemon_4.0.6_{arch}.ipk
```

Unixplay runs `opkg install`, `opkg upgrade`, `opkg remove` and `opkg status`; it does not duplicate the package's init or autostart logic. Bash and hybrid packages may define `install`, `update`, `remove` and `status` scripts. An application that exposes an interactive terminal can declare `terminal.provider: ttyd`.

