FROM php:8.2-apache

# Apache の rewrite モジュール有効化
RUN a2enmod rewrite

# PostgreSQL 拡張・その他ツール・Xdebug インストール
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    unzip \
    vim \
    && docker-php-ext-install pdo pdo_pgsql \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && rm -rf /var/lib/apt/lists/*

# Composer をインストール
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# DocumentRootを/workspace/に設定
ENV APACHE_DOCUMENT_ROOT /workspace
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 作業ディレクトリ
WORKDIR /workspace

# ポート公開（Apache）
EXPOSE 80
