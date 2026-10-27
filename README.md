# Playkeen registry

The catalog includes Playkeen-compatible apps, curated upstream opkg packages, and adapters hosted in the shared [`keenplay-adapters`](https://github.com/tommilevs/keenplay-adapters) repository. `registry/curated.json` selects native packages; `registry/adapters.json` lists app manifests and release bundles. The registry builder records GitHub's SHA-256 asset digest. Curation identifies the publisher and artifact; it is not a security audit.

NFQWS2 is installed from the upstream Entware IPK and its lifecycle remains managed by opkg. Its network filtering starts during package installation; see the [upstream documentation](https://github.com/nfqws/nfqws2-keenetic) for prerequisites and configuration.

The S-UI adapter adopts an existing Keenetic installation without moving its database, certificates, configuration or service. See its [migration guide](https://github.com/tommilevs/keenplay-adapters/blob/main/apps/keenplay-s-ui/MIGRATION.md).

Lightweight hybrid application catalog and manager for Entware/Keenetic-style devices.

```sh
npm test
npm start
```

Open `http://127.0.0.1:8787`. The MVP provides a static registry, dependency-free web UI, persisted locale selection, developer/debug flags and safe diagnostics redaction. Public versions are intended to come from GitHub Releases.

## Русский

Каталог содержит приложения Playkeen, отобранные нативные пакеты opkg и адаптеры из общего репозитория [`keenplay-adapters`](https://github.com/tommilevs/keenplay-adapters). Нативные пакеты перечислены в `registry/curated.json`, адаптеры — в `registry/adapters.json`; сборщик сохраняет SHA-256 опубликованного файла. Проверка источника и контрольной суммы не является аудитом безопасности.

NFQWS2 устанавливается из оригинального Entware IPK, а его установкой, обновлением и удалением управляет opkg. Пакет запускает сетевую фильтрацию во время установки; требования и настройка описаны в [проекте автора](https://github.com/nfqws/nfqws2-keenetic).

Адаптер S-UI подключает уже установленную Keenetic-версию, не перемещая базу, сертификаты, конфигурацию и службу. См. [инструкцию миграции](https://github.com/tommilevs/keenplay-adapters/blob/main/apps/keenplay-s-ui/MIGRATION.md).

Лёгкий гибридный каталог и менеджер приложений для устройств Entware/Keenetic.

```sh
npm test
npm start
```

Откройте `http://127.0.0.1:8787`. MVP использует статический registry, лёгкий WEB UI без зависимостей, сохранение выбранного языка, режимы developer/debug и безопасное скрытие диагностических секретов. Публичные версии приложений публикуются через GitHub Releases.
