# Let's Encrypt demo
Sample code for Let's Encrypt with Node.js

## Manage certificate with certbot

The following is a list of instructions to install **Let's Encrypt**
with **Apache** and **nginx** on **CentOS 7**, forwarding traffic to **Node.js**.

- Make sure port 443 is opened (AWS or MOC)
- Install EPEL
  
`$ sudo yum install epel-release`

- Install Apache

```
$ sudo yum install httpd
$ sudo systemctl start httpd
$ sudo systemctl enable httpd
```

- Install mod\_ssl

`$ sudo yum install mod_ssl`

- Install [certbot](https://certbot.eff.org/#centosrhel7-apache)

`$ sudo yum install python-certbot-apache`

- Run certbot to generate certificate for Apache

`$ sudo certbot --apache`

- Certificates are only valid for 90 days, so set crontab for [auto renewal](https://certbot.eff.org/docs/using.html#renewal)

`$ sudo crontab -e`
    
Add the following line to run certbot every 12 hours: `0 */12 * * * certbot renew --quiet`

- Forward traffic from Apache to Node.js

`$ sudo vim /etc/httpd/conf.d/ssl.conf`

- Add the following to the bottom of the file, just before `</VirtualHost>`

```
ProxyRequests Off

<Proxy *>
    Order deny,allow
    Allow from all
</Proxy>

<Location />
    ProxyPass http://localhost:9000/
    ProxyPassReverse http://localhost:9000/
</Location>
```

- Add the following to the nginx config file (/etc/nginx/nginx.conf)
  
```
# Settings for a TLS enabled server.

    server {
        listen       443 ssl http2 default_server;
        listen       [::]:443 ssl http2 default_server;
        server_name  _;
        root         /usr/share/nginx/html;

        ssl_certificate "/etc/pki/nginx/server.cer";
        ssl_certificate_key "/etc/pki/nginx/private/server.key";
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout  10m;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location /im-well/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        error_page 404 /404.html;
            location = /40x.html {
        }

        error_page 500 502 503 504 /50x.html;
            location = /50x.html {
        }
    }

}
```
