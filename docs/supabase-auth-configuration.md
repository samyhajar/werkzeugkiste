# Supabase Auth Konfiguration

## Problem: Passwort zurücksetzen funktioniert nicht

Wenn Benutzer den "Passwort vergessen"-Link anklicken und eine E-Mail erhalten, aber dann auf der Website das Passwort nicht zurücksetzen können, liegt das meistens an fehlenden **Redirect-URL-Konfigurationen** in Supabase.

## Lösung: Redirect-URLs in Supabase konfigurieren

### Schritt 1: Supabase Dashboard öffnen

1. Gehe zu [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt aus
3. Navigiere zu **Authentication** → **URL Configuration**

### Schritt 2: Redirect URLs hinzufügen

Füge folgende URLs zur Liste der erlaubten **Redirect URLs** hinzu:

**Für Produktion:**

```
https://DEINE-DOMAIN.de/auth/callback
https://DEINE-DOMAIN.de/auth/password-reset
```

**Für Entwicklung (localhost):**

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/password-reset
```

**Für Vercel-Preview-Deployments:**

```
https://*.vercel.app/auth/callback
https://*.vercel.app/auth/password-reset
```

### Schritt 3: Site URL setzen

Setze die **Site URL** auf deine Produktions-Domain:

```
https://DEINE-DOMAIN.de
```

### Wichtig: Wildcard-Muster

Supabase unterstützt Wildcard-Muster wie `https://*.vercel.app/*` für Preview-Deployments.

## E-Mail-Templates anpassen

Die Passwort-Reset-E-Mail kann unter **Authentication** → **Email Templates** → **Reset Password** angepasst werden.

Standard-Template verwendet `{{ .ConfirmationURL }}` welches automatisch die richtige URL generiert.

## Debugging

Falls es weiterhin nicht funktioniert:

1. Prüfe die Browser-Konsole auf Fehlermeldungen
2. Prüfe die Supabase-Logs unter **Logs** → **Edge Functions** / **Auth**
3. Stelle sicher, dass die E-Mail-Domain für Supabase freigeschaltet ist (bei benutzerdefinierten SMTP-Servern)

## Kontakt

Bei weiteren Problemen wende dich an das Entwicklungsteam.
