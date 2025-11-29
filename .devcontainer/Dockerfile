FROM mcr.microsoft.com/devcontainers/php:1-8.3-bullseye

# Install PostgreSQL client and PHP PostgreSQL extensions
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        postgresql-client \
        libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install useful PHP extensions
RUN docker-php-ext-install opcache

# Configure PHP
RUN echo "memory_limit=512M" > /usr/local/etc/php/conf.d/memory-limit.ini \
    && echo "upload_max_filesize=50M" > /usr/local/etc/php/conf.d/upload-limit.ini \
    && echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/upload-limit.ini

# Set working directory
WORKDIR /workspace
