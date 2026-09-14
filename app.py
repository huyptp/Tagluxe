import os
import json
import uuid
import threading
import time
import urllib.request
from datetime import datetime
from urllib.parse import quote, urlsplit
from xml.etree import ElementTree as ET
from flask import Flask, render_template, request, redirect, session, flash, url_for, Response
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'tagluxe_super_secret_key'
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit
app.config['FACEBOOK_PIXEL_ID'] = os.environ.get('FACEBOOK_PIXEL_ID', '')
app.config['GOOGLE_SITE_VERIFICATION'] = os.environ.get('GOOGLE_SITE_VERIFICATION', '')

DATA_FILE = 'data.json'

def site_origin():
    value = os.environ.get('SITE_URL', 'https://tagluxe.onrender.com').rstrip('/')
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
        return 'https://tagluxe.onrender.com'
    return value

@app.context_processor
def seo_context():
    return {'site_url': site_origin()}

def product_schema(product):
    origin = site_origin()
    result = {
        '@context': 'https://schema.org', '@type': 'Product',
        'name': product['name'], 'description': product.get('description', ''),
        'url': origin + '/product/' + quote(product['id'], safe=''),
        'brand': {'@type': 'Brand', 'name': 'TagLuxe'},
        'sku': 'TL-PROD-' + product['id'],
    }
    images = product.get('images') or ([product['image']] if product.get('image') else [])
    if images:
        result['image'] = [origin + '/static/uploads/' + quote(img, safe='') for img in images if img]
    if product.get('price_type') == 'fixed' and product.get('price', 0) > 0:
        result['offers'] = {'@type': 'Offer', 'priceCurrency': 'VND', 'price': product['price'], 'url': result['url']}
    return result

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"products": []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    data = load_data()
    # Chỉ lấy sản phẩm đang visible
    products = [p for p in data.get('products', []) if p.get('visible', True)]
    # Tách thành dây đeo và phụ kiện
    lanyards = [p for p in products if p.get('category') == 'lanyard']
    accessories = [p for p in products if p.get('category') == 'accessory']

    # Build danh sách ảnh dây đeo duy nhất (dedup bằng Python)
    seen = set()
    lanyard_photos = []  # [{img, product_id, product_name}, ...]
    for p in lanyards:
        imgs = p.get('images') or ([p.get('image')] if p.get('image') else [])
        for img in imgs:
            if img and img not in seen:
                seen.add(img)
                lanyard_photos.append({
                    'img': img,
                    'product_id': p['id'],
                    'product_name': p['name']
                })

    # Build danh sách toàn bộ ảnh sản phẩm thực tế cho Showcase Slider (Dây đeo, Thẻ nhựa, Vỏ thẻ, Poster)
    showcase_items = []
    showcase_seen = set()

    # 1. Các hình ảnh poster / sự kiện thực tế
    posters_data = [
        {'img': 'media_1789320576400.jpg', 'title': 'Dây Đeo Thẻ Fandom & Concert', 'category': 'lanyard', 'cat_label': 'Dây Đeo Thẻ', 'desc': 'In ấn họa tiết sắc nét, màu sắc tươi sáng theo thiết kế riêng.'},
        {'img': 'media_1789320576594.jpg', 'title': 'Bộ Dây Đeo & Vỏ Thẻ Trường Học', 'category': 'set', 'cat_label': 'Bộ Sản Phẩm', 'desc': 'Dây đeo RMIT kết hợp vỏ thẻ màu sắc đồng bộ, nổi bật.'},
        {'img': 'media_1789320576602.jpg', 'title': 'Dây Đeo Thẻ Doanh Nghiệp & Sự Kiện', 'category': 'lanyard', 'cat_label': 'Dây Đeo Thẻ', 'desc': 'Tone màu sang trọng, móc khóa inox bền bỉ, nhận in từ 10 dây.'},
        {'img': 'media_1789320576614.jpg', 'title': 'Dây Đeo Thẻ Câu Lạc Bộ & Đội Nhóm', 'category': 'lanyard', 'cat_label': 'Dây Đeo Thẻ', 'desc': 'Chất liệu lụa Satin mịn màng, phối màu tươi trẻ năng động.'},
        {'img': 'media_1789320576620.jpg', 'title': 'Dây Đeo Thẻ Hội Nghị Quốc Tế', 'category': 'lanyard', 'cat_label': 'Dây Đeo Thẻ', 'desc': 'Họa tiết độc đáo, công nghệ in chuyển nhiệt sắc nét không phai.'}
    ]
    for item in posters_data:
        showcase_seen.add(item['img'])
        showcase_items.append(item)

    # 2. Toàn bộ ảnh Thẻ Nhựa PVC & Vỏ Đựng Thẻ (Phụ kiện)
    for acc in accessories:
        imgs = acc.get('images') or ([acc.get('image')] if acc.get('image') else [])
        is_pvc = 'PVC' in acc.get('name', '')
        cat_key = 'pvc' if is_pvc else 'holder'
        cat_lbl = 'Thẻ Nhựa PVC' if is_pvc else 'Vỏ Đựng Thẻ'
        for idx, img in enumerate(imgs):
            if img and img not in showcase_seen:
                showcase_seen.add(img)
                showcase_items.append({
                    'img': img,
                    'title': f"{acc['name']} — Mẫu {idx + 1}",
                    'category': cat_key,
                    'cat_label': cat_lbl,
                    'desc': acc.get('description', '')
                })

    # 3. Toàn bộ ảnh Dây Đeo Thẻ thực tế
    for p in lanyards:
        imgs = p.get('images') or ([p.get('image')] if p.get('image') else [])
        for idx, img in enumerate(imgs):
            if img and img not in showcase_seen:
                showcase_seen.add(img)
                showcase_items.append({
                    'img': img,
                    'title': f"{p['name']} — Mẫu {idx + 1}",
                    'category': 'lanyard',
                    'cat_label': 'Dây Đeo Thẻ',
                    'desc': p.get('description', '')
                })

    return render_template('index.html',
                           lanyards=lanyards,
                           accessories=accessories,
                           lanyard_photos=lanyard_photos,
                           showcase_items=showcase_items)

@app.route('/product/<id>')
def product_detail(id):
    data = load_data()
    product = next((p for p in data.get('products', []) if p.get('id') == id and p.get('visible', True)), None)
    if not product:
        return "Sản phẩm không tồn tại hoặc đã bị ẩn", 404
    
    # Gợi ý phụ kiện
    accessories = [p for p in data.get('products', []) if p.get('category') == 'accessory' and p.get('visible', True)]
    return render_template('product.html', product=product, accessories=accessories, product_jsonld=product_schema(product))

# --- ADMIN ROUTES ---

def login_required(f):
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            return redirect(url_for('admin_login'))
    wrap.__name__ = f.__name__
    return wrap

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        # Default credentials
        if username == 'admin' and password == 'admin123':
            session['logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Sai tên đăng nhập hoặc mật khẩu', 'error')
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin')
@login_required
def admin_dashboard():
    return redirect(url_for('admin_products'))

@app.route('/admin/products')
@login_required
def admin_products():
    data = load_data()
    products = data.get('products', [])
    return render_template('admin/products.html', products=products)

@app.route('/admin/products/add', methods=['GET', 'POST'])
@login_required
def admin_add_product():
    if request.method == 'POST':
        name = request.form.get('name')
        category = request.form.get('category')
        description = request.form.get('description')
        width = request.form.get('width')
        min_order = int(request.form.get('min_order', 10))
        price_type = request.form.get('price_type')
        price = int(request.form.get('price', 0) or 0)
        featured = request.form.get('featured') == 'on'
        visible = request.form.get('visible') == 'on'

        image_filenames = []
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file and file.filename != '':
                    filename = secure_filename(file.filename)
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                    image_filenames.append(unique_filename)

        new_product = {
            "id": uuid.uuid4().hex[:8],
            "name": name,
            "category": category,
            "description": description,
            "images": image_filenames,
            "width": width,
            "min_order": min_order,
            "price_type": price_type,
            "price": price,
            "featured": featured,
            "visible": visible
        }

        data = load_data()
        if 'products' not in data:
            data['products'] = []
        data['products'].append(new_product)
        save_data(data)
        flash('Thêm sản phẩm thành công', 'success')
        return redirect(url_for('admin_products'))

    return render_template('admin/product_form.html', product=None)

@app.route('/admin/products/edit/<id>', methods=['GET', 'POST'])
@login_required
def admin_edit_product(id):
    data = load_data()
    product = next((p for p in data.get('products', []) if p.get('id') == id), None)
    if not product:
        return "Sản phẩm không tồn tại", 404

    if request.method == 'POST':
        product['name'] = request.form.get('name')
        product['category'] = request.form.get('category')
        product['description'] = request.form.get('description')
        product['width'] = request.form.get('width')
        product['min_order'] = int(request.form.get('min_order', 10))
        product['price_type'] = request.form.get('price_type')
        product['price'] = int(request.form.get('price', 0) or 0)
        product['featured'] = request.form.get('featured') == 'on'
        product['visible'] = request.form.get('visible') == 'on'

        if 'images' in request.files:
            files = request.files.getlist('images')
            new_images = []
            for file in files:
                if file and file.filename != '':
                    filename = secure_filename(file.filename)
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                    new_images.append(unique_filename)
            if new_images:
                product['images'] = new_images

        save_data(data)
        flash('Cập nhật sản phẩm thành công', 'success')
        return redirect(url_for('admin_products'))

    return render_template('admin/product_form.html', product=product)

@app.route('/admin/products/delete/<id>', methods=['POST'])
@login_required
def admin_delete_product(id):
    data = load_data()
    data['products'] = [p for p in data.get('products', []) if p.get('id') != id]
    save_data(data)
    flash('Xóa sản phẩm thành công', 'success')
    return redirect(url_for('admin_products'))

@app.route('/sitemap.xml')
def sitemap():
    data = load_data()
    products = [p for p in data.get('products', []) if p.get('visible', True)]
    origin = site_origin()
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    image_ns = 'http://www.google.com/schemas/sitemap-image/1.1'
    ET.register_namespace('', ns)
    ET.register_namespace('image', image_ns)
    root = ET.Element(f'{{{ns}}}urlset')
    home = ET.SubElement(root, f'{{{ns}}}url')
    ET.SubElement(home, f'{{{ns}}}loc').text = origin + '/'
    for product in products:
        entry = ET.SubElement(root, f'{{{ns}}}url')
        ET.SubElement(entry, f'{{{ns}}}loc').text = origin + '/product/' + quote(product['id'], safe='')
        images = product.get('images') or ([product['image']] if product.get('image') else [])
        for filename in dict.fromkeys(img for img in images if img):
            image = ET.SubElement(entry, f'{{{image_ns}}}image')
            ET.SubElement(image, f'{{{image_ns}}}loc').text = origin + '/static/uploads/' + quote(filename, safe='')
    # Do not claim every URL was updated today when its content did not change.
    return Response(ET.tostring(root, encoding='utf-8', xml_declaration=True), mimetype='application/xml')

@app.route('/robots.txt')
def robots():
    site_url = site_origin()
    txt = f'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/*\nSitemap: {site_url}/sitemap.xml\n'
    return Response(txt, mimetype='text/plain')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.after_request
def add_seo_headers(response):
    if request.path.startswith('/admin') or request.path == '/ping' or response.status_code >= 400:
        response.headers['X-Robots-Tag'] = 'noindex, nofollow'
    # Cache static assets
    if '/static/' in response.headers.get('Content-Type', '') or request.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'public, max-age=2592000'
    # Basic security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response


# ===== KEEP-ALIVE: Prevent Render free tier from sleeping =====
@app.route('/ping')
def ping():
    """Health check endpoint used by keep-alive thread"""
    return 'OK', 200

def _keep_alive_worker():
    """
    Background thread: ping the app's own public URL every 10 minutes
    so Render's free tier never sleeps. Only runs on Render (RENDER env var set).
    """
    site_url = os.environ.get('SITE_URL', 'https://tagluxe.onrender.com').rstrip('/')
    ping_url = f'{site_url}/ping'
    # Wait 2 minutes after startup before first ping
    time.sleep(120)
    while True:
        try:
            with urllib.request.urlopen(ping_url, timeout=15) as resp:
                pass  # just keep the connection alive
        except Exception:
            pass  # ignore errors, retry next cycle
        time.sleep(600)  # ping every 10 minutes

# Only start keep-alive on Render deployment (RENDER env var is set by Render automatically)
if os.environ.get('RENDER'):
    _t = threading.Thread(target=_keep_alive_worker, daemon=True)
    _t.start()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
