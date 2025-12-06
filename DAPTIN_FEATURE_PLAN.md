# Daptin Dashboard: Feature Reference

## Overview

All Daptin features and their corresponding system entities. The dashboard provides text-based UI (tables, forms, code editors) for managing these.

---

## System Entities

| Entity | Purpose | Special UI Needs |
|--------|---------|------------------|
| `action` | Workflow actions | YAML editor, executor form |
| `world` | Entity schemas | Permission editor |
| `smd` | State machine definitions | YAML view, event trigger |
| `user_account` | Users | Group membership |
| `usergroup` | Groups | Member list |
| `cloud_store` | Storage connections | File browser |
| `site` | Static sites | Preview link |
| `certificate` | SSL certs | DKIM display, gen actions |
| `oauth_connect` | OAuth providers | Token generator |
| `oauth_token` | OAuth tokens | - |
| `mail_server` | SMTP servers | - |
| `mail_account` | Email accounts | - |
| `data_exchange` | External sync | YAML config |
| `stream` | Data views | JSON config, preview |
| `integration` | API specs | Operations list |

---

## Daptin Actions (40+)

### System Actions
| Action | Entity | Purpose |
|--------|--------|---------|
| `restart_daptin` | world | Restart server |
| `generate_random_data` | world | Generate test data |
| `upload_csv_to_system_schema` | world | Import CSV |
| `upload_xlsx_to_system_schema` | world | Import Excel |
| `__data_export` | world | Export data |
| `__download_cms_config` | world | Export schema |

### Certificate Actions
| Action | Entity | Purpose |
|--------|--------|---------|
| `generate_self_certificate` | certificate | Self-signed cert |
| `generate_acme_certificate` | certificate | Let's Encrypt cert |

### Cloud Storage Actions
| Action | Entity | Purpose |
|--------|--------|---------|
| `cloudstore.file.upload` | cloud_store | Upload file |
| `cloudstore.file.delete` | cloud_store | Delete file |
| `cloudstore.folder.create` | cloud_store | Create folder |
| `site.file.list` | site | List files |
| `site.file.get` | site | Get file content |
| `column.storage.sync` | world | Sync asset column |

### OAuth Actions
| Action | Entity | Purpose |
|--------|--------|---------|
| `oauth.client.redirect` | oauth_connect | Start OAuth flow |
| `oauth.login.response` | oauth_connect | Handle callback |
| `oauth.token` | oauth_token | Get access token |

### Auth Actions
| Action | Entity | Purpose |
|--------|--------|---------|
| `signin` | user_account | Login |
| `signup` | user_account | Register |
| `__become_admin` | user_account | First admin |
| `password.reset.begin` | user_account | Password reset |
| `otp.generate` | user_account | Generate OTP |
| `otp.login.verify` | user_account | Verify OTP |

---

## Permission System

### Bits (7 per level)
| Bit | Name | Value |
|-----|------|-------|
| 0 | Peek | 1 |
| 1 | Read | 2 |
| 2 | Create | 4 |
| 3 | Update | 8 |
| 4 | Delete | 16 |
| 5 | Execute | 32 |
| 6 | Refer | 64 |

### Levels
- Guest: bits 0-6
- User: bits 7-13
- Group: bits 14-20

### Common Presets
| Name | Value | Meaning |
|------|-------|---------|
| Public Read | 2097154 | Guest read, User CRUD |
| User Only | 2097152 | No guest access |
| Full Access | 2097279 | Everyone all permissions |

---

## WebSocket Topics

### Methods
- `list-topic` - List available topics
- `subscribe` - Subscribe with optional filters
- `unsubscribe` - Unsubscribe from topic
- `create-topic` - Create custom topic
- `destroy-topic` - Delete custom topic
- `new-message` - Broadcast to topic

### Event Types
- `create` - Row created
- `update` - Row updated
- `delete` - Row deleted

---

## Cloud Storage Providers (30+)

- S3, GCS, Azure Blob, Backblaze B2, Wasabi
- Google Drive, Dropbox, OneDrive, pCloud
- FTP, SFTP, WebDAV
- Local filesystem

---

## Configuration Keys

| Key | Purpose |
|-----|---------|
| `hostname` | System hostname |
| `graphql.enable` | Enable GraphQL |
| `imap.enabled` | Enable IMAP |
| `imap.listen_interface` | IMAP interface |
| `jwt.secret` | JWT signing key |

---

## URL Structure

```
/admin/actions                    # action entity
/admin/actions/[id]/execute       # action executor
/admin/permissions                # entities with permission editor
/admin/users                      # user_account entity
/admin/groups                     # usergroup entity
/admin/state-machines             # smd entity

/storage/cloud-stores             # cloud_store entity
/storage/cloud-stores/[id]/browse # file browser
/storage/sites                    # site entity
/storage/certificates             # certificate entity

/communication/oauth              # oauth_connect entity
/communication/oauth/[id]/tokens  # oauth_token list
/communication/email              # mail_server + mail_account
/communication/websocket          # topic list + event stream

/data/import                      # file upload + action
/data/export                      # export action
/data/exchanges                   # data_exchange entity
/data/streams                     # stream entity
/data/integrations                # integration entity

/tools/graphql                    # GraphiQL embed
/tools/audit                      # audit log viewer

/config                           # config key-value editor
```
