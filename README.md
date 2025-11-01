# Order Room v1.5 (Static + Supabase)
- מסך התחברות ראשון (Email+Password או Magic Link) דרך Supabase
- בדיקת הרשאה (`allowed_users`)
- הזמנות נשמרות ב־`orders` + `order_items`
- ניהול ספקים ופריטים דרך מסך הגדרות
- סיכום חודשי לפי פריט (RPC)

## Supabase
1) הפעל Email+Password ב-Auth
2) הרץ SQL מ-`sql/schema_v1_5.sql`
3) הוסף אימיילים לטבלת `allowed_users`
4) אין צורך ב-Storage

## קונפיג
`or.config.js`:
```html
<script>
window.OR_CONFIG = { SUPABASE_URL:'https://YOUR-REF.supabase.co', SUPABASE_ANON:'YOUR-ANON-PUBLIC-KEY' }
</script>
```
או localStorage.

