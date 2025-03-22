cd /var/www/PDF-SISTEMA

echo "➤ Actualizando código desde GitHub..."
git pull origin main

echo "➤ Instalando dependencias..."
npm install

echo "➤ Compilando proyecto..."
NODE_ENV=production npm run build

echo "➤ Reiniciando PM2..."
pm2 restart PDF-SISTEMA
