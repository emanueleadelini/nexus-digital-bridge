# DNS da pubblicare su Aruba (pannello domini nexusdigitalbridge.it)

Senza questi record Gmail/Outlook rifiutano le email della piattaforma
(postfix self-hosted). Le firma DKIM lato server è già attiva.

## 1. SPF (obbligatorio)

Tipo: **TXT**
Nome/host: `@` (oppure vuoto — radice del dominio)
Valore:

```
v=spf1 ip4:51.210.214.63 -all
```

## 2. DKIM (obbligatorio)

Tipo: **TXT**
Nome/host: `mail._domainkey`
Valore (una sola riga, il valore tra doppi apici va unito):

```
v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsfeJ1JqSw2y4MsmxhHB4AQZQiZrB57VbyMVTKzqmRkAIA9y6RXfs21C2lEiiFtFe8IYO1ZaCaofAbMGS8ofwbwSR85fquNhVIJROtCiGZb6fUFDpf6nuq2V3Wz4nmnRmI1F5S2OYQGuGfc8I/hmMy4QqOZSwJkCY4v7fEQO5MiS+Fqgdfgri5bSxjnmOJKZLpbtzlOdSwYOFbsX8jCYUHeg++p6db5dSYLExDfo9ETogzr/Xygdp8uOmapqTX/Dh5TYyAu0yKoHDNx1nI1paZoZ97wydkfOZigtb1gDBY/3XhHWJ1Iz4Izir3tYWFD54vX9c3tmA5DqjPIInWOzKfQIDAQAB
```

## 3. PTR reverse (consigliato — pannello OVH)

Nel pannello OVH: IP `51.210.214.63` → reverse DNS `nexusdigitalbridge.it`
(non bloccante con SPF/DKIM ok, ma aumenta la deliverability).

## 4. DMARC (opzionale ma consigliato)

Tipo: **TXT**
Nome/host: `_dmarc`
Valore:

```
v=DMARC1; p=quarantine; rua=mailto:emanueleadelini@gmail.com
```

## Verifica dopo pubblicazione (dal server)

```bash
dig TXT nexusdigitalbridge.it +short        # deve mostrare v=spf1...
dig TXT mail._domainkey.nexusdigitalbridge.it +short
curl -s -X POST http://127.0.0.1:8812/api/auth/request-password-reset \
  -H 'Content-Type: application/json' \
  -d '{"email":"emanueleadelini@gmail.com","redirectTo":"https://nexusdigitalbridge.it/reset-password"}'
tail -5 /var/log/mail.log   # status deve essere "sent", non "bounced"
```
