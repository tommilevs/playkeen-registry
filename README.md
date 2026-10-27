# Playkeen registry

The catalog includes Playkeen-compatible applications and curated native opkg packages from their original publishers. `registry/curated.json` lists the latter; the registry builder selects their latest stable GitHub Release asset and records its GitHub SHA-256 digest. Curation identifies the source and artifact; it is not a security audit.

NFQWS2 is installed from the upstream Entware IPK and its lifecycle remains managed by opkg. Its network filtering starts during package installation; see the [upstream documentation](https://github.com/nfqws/nfqws2-keenetic) for prerequisites and configuration.

Lightweight hybrid application catalog and manager for Entware/Keenetic-style devices.

```sh
npm test
npm start
```

Open `http://127.0.0.1:8787`. The MVP provides a static registry, dependency-free web UI, persisted locale selection, developer/debug flags and safe diagnostics redaction. Public versions are intended to come from GitHub Releases.

## Русский

Каталог содержит приложения Playkeen и отобранные нативные пакеты opkg от их авторов. Последние перечислены в `registry/curated.json`: сборщик выбирает последний стабильный GitHub Release и сохраняет SHA-256 опубликованного файла. Проверка источника и контрольной суммы не является аудитом безопасности.

NFQWS2 устанавливается из оригинального Entware IPK, а его установкой, обновлением и удалением управляет opkg. Пакет запускает сетевую фильтрацию во время установки; требования и настройка описаны в [проекте автора](https://github.com/nfqws/nfqws2-keenetic).

Лёгкий гибридный каталог и менеджер приложений для устройств Entware/Keenetic.

```sh
npm test
npm start
```

Откройте `http://127.0.0.1:8787`. MVP использует статический registry, лёгкий WEB UI без зависимостей, сохранение выбранного языка, режимы developer/debug и безопасное скрытие диагностических секретов. Публичные версии приложений публикуются через GitHub Releases.
