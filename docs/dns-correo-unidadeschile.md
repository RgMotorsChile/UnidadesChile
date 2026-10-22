# DNS de correo — Unidades Chile

No se modificó el DNS. Esto es lo que hay que publicar, y lo que no hay que tocar.

Consultado el 22 de octubre de 2026. El sitio envía con **Resend** (`https://api.resend.com/emails`). El remitente actual es `Unidades Chile <noreply@rgmotorschile.cl>` (`CONSIGNA_FROM`). El buzón de destino por defecto es `administracion@rgmotors.cl` (`CONSIGNA_TO`).

Ese correo de destino queda como duda para Mathias: es el buzón de RG Motors, no un correo `@unidadeschile.cl`.

## Lo que ya existe

`unidadeschile.cl` no tiene SPF ni DMARC. Sí tiene DKIM de Resend, ya publicado. No crear otro registro con el mismo nombre.

| Host | Tipo | Valor observado |
| --- | --- | --- |
| `resend._domainkey.unidadeschile.cl` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdGxUhJiNUd+i+xdemmMLhcnMTeCoY6avqrtx/F0O8m2Khg8v7kAaNmSdTdhdOAuzyyeu4OLxejB+G+YvGZm+LoSHsqfKzuDkWFzdoH6oSrjPPkCd+a/hHsejLf5UXUGdu0oD60EEcTMS1yk6rXtOdQ9fX+trRqKVC898yn8dJCQIDAQAB` |

`rgmotorschile.cl` ya autentica correo y no hay que debilitarlo:

- SPF: `v=spf1 include:_spf.google.com ~all`
- DMARC: `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:administracion@rgmotorschile.cl`
- DKIM Resend en `resend._domainkey.rgmotorschile.cl`
- Retorno Resend en `send.rgmotorschile.cl`: TXT `v=spf1 include:amazonses.com ~all` y MX `10 feedback-smtp.sa-east-1.amazonses.com`

La región real de esta cuenta de Resend es `sa-east-1`.

## Registros a agregar en unidadeschile.cl

El dominio no tiene SPF. Agregar un TXT en el apex, sin borrar el TXT de Google Site Verification que ya está.

```txt
unidadeschile.cl.  TXT  "v=spf1 include:amazonses.com ~all"
```

DMARC en monitoreo. El informe va a `administracion@rgmotors.cl` porque ese dominio sí tiene MX. Si Mathias confirma otro buzón, se cambia solo el `rua`.

```txt
_dmarc.unidadeschile.cl.  TXT  "v=DMARC1; p=none; rua=mailto:administracion@rgmotors.cl; fo=1; adkim=r; aspf=r"
```

DKIM: no agregar nada. El registro `resend._domainkey` de la tabla de arriba ya está publicado. Si Resend muestra una clave distinta en el panel, se reemplaza ese valor; no se crea un segundo TXT con el mismo host.

## Cómo pasar de p=none a quarantine

1. Publicar `p=none` y leer los informes una o dos semanas.
2. Si Resend alinea DKIM y no aparecen fallos de correo legítimo, cambiar a cuarentena parcial:

```txt
_dmarc.unidadeschile.cl.  TXT  "v=DMARC1; p=quarantine; pct=25; rua=mailto:administracion@rgmotors.cl; fo=1; adkim=r; aspf=r"
```

3. Subir `pct` a `100` cuando los informes sigan limpios.
4. `p=reject` queda para después. No copiar el `p=reject` de `rgmotorschile.cl` el primer día.

## Retorno de Resend, sin aplicarlo todavía

`send.unidadeschile.cl` hoy apunta a Forge (`send.forge.rmta.net`), con SPF y MX propios. No reemplazar esos registros hasta que Mathias confirme que Forge ya no se usa.

Cuando se confirme, el patrón que esta misma cuenta de Resend ya usa en `send.rgmotorschile.cl` es:

```txt
send.unidadeschile.cl.  TXT  "v=spf1 include:amazonses.com ~all"
send.unidadeschile.cl.  MX   10 feedback-smtp.sa-east-1.amazonses.com.
```

Mientras el `From` siga siendo `noreply@rgmotorschile.cl`, la autenticación que importa para ese envío es la de `rgmotorschile.cl`, que ya está. Los registros nuevos de `unidadeschile.cl` hacen falta para poder enviar como `@unidadeschile.cl` y para cerrar el hallazgo de la auditoría.
