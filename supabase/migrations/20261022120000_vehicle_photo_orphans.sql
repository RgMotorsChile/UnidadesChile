-- Fotos de catálogo en el bucket público `vehicle-photos`.
-- Path: <tenant_slug>/<vehicle_slug>/<sha256>.<ext>
--   Unidades Chile usa el prefijo unidades-chile/<slug>/.
--
-- No hay período de gracia. Al vender un auto, borrarlo, o quitar/reemplazar
-- una foto, la app borra el objeto en Storage después de confirmar el cambio
-- en catalog_vehicles. Esta tabla solo registra los borrados que fallaron,
-- para que el job de huérfanos de RgMotorsChileWeb los reintente.
--
-- Contrato del job (service_role):
-- 1. Leer public.vehicle_photo_orphans donde purged_at is null.
-- 2. Si object_path termina en '/', listar vehicle-photos bajo ese prefijo
--    (sin la barra) y borrar cada archivo. Ese caso es un listado fallido
--    al vender o borrar el auto.
-- 3. Si no termina en '/', borrar ese object_path del bucket.
-- 4. Antes de borrar, no tocar un path que siga en catalog_vehicles.image
--    o catalog_vehicles.gallery (el auto volvió, o la foto sigue publicada).
-- 5. Si el objeto ya no existe, o se borró bien, setear purged_at = now().
-- 6. reason es sold | deleted | removed | replaced.
--
-- Aplicar una sola vez en el proyecto compartido (tuybpizjeszgwtcvunmp).
-- IF NOT EXISTS: si el otro repo crea la misma tabla, este SQL no la pisa.

create table if not exists public.vehicle_photo_orphans (
  bucket text not null default 'vehicle-photos',
  object_path text not null,
  tenant_slug text not null,
  vehicle_slug text not null default '',
  public_url text not null default '',
  reason text not null check (reason in ('sold', 'deleted', 'removed', 'replaced')),
  error text not null default '',
  created_at timestamptz not null default now(),
  purged_at timestamptz,
  primary key (bucket, object_path)
);

comment on table public.vehicle_photo_orphans is
  'Objetos de vehicle-photos cuyo borrado inmediato falló. El job de huérfanos de RgMotorsChileWeb los reintenta y setea purged_at.';

comment on column public.vehicle_photo_orphans.object_path is
  'Path dentro del bucket, o prefijo unidades-chile/<slug>/ si no se pudo listar la carpeta.';

comment on column public.vehicle_photo_orphans.reason is
  'sold: venta. deleted: auto borrado. removed: foto quitada. replaced: foto reemplazada.';

create index if not exists vehicle_photo_orphans_pending_idx
  on public.vehicle_photo_orphans (created_at)
  where purged_at is null;

alter table public.vehicle_photo_orphans enable row level security;

revoke all on table public.vehicle_photo_orphans from public, anon, authenticated;
grant select, insert, update, delete on table public.vehicle_photo_orphans to service_role;
