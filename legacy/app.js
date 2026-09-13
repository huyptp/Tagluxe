/* ==========================================================================
   TAGLUXE STUDIO - INTERACTIVE APPLICATION LOGIC & CANVAS RENDERER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // --- STATE MANAGEMENT ---
    const state = {
        width: 2.0,            // cm: 1.5, 2.0, 2.5
        material: 'poly',      // 'poly', 'satin', 'eco'
        printTech: 'sublimation', // 'sublimation', 'screen', 'woven'
        strapColor: '#0f172a',
        borderColor: '#6366f1',
        text: 'TAGLUXE • IN DÂY ĐEO THẺ UTE',
        textFont: "'Plus Jakarta Sans', sans-serif",
        textColor: '#ffffff',
        logoImg: null,
        repeatLogo: true,
        hook: 'lobster',       // 'lobster', 'oval', 'bulldog', 'keyring'
        safetyBreakaway: true,
        quickRelease: false,
        badgeHolder: 'pvc',    // 'pvc', 'acrylic', 'leather', 'none'
        quantity: 100,
        showBadgeCard: true,
        isFlipped: false,
        cart: []
    };

    // Preset Color Lists
    const PRESET_COLORS = [
        '#0f172a', '#1e1b4b', '#064e3b', '#881337', '#78350f',
        '#6366f1', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b',
        '#ffffff', '#64748b'
    ];

    // --- DOM ELEMENTS ---
    const canvas = document.getElementById('lanyardCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    // --- INITIALIZATION ---
    initTheme();
    initColorPalettes();
    initEventListeners();
    renderProductsCatalog();
    renderCanvas();
    updatePrices();

    // --- THEME TOGGLE ---
    function initTheme() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (!themeBtn) return;
        
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
        });
    }

    // --- COLOR PALETTES ---
    function initColorPalettes() {
        const strapContainer = document.getElementById('strapColorPalette');
        const borderContainer = document.getElementById('borderColorPalette');

        if (strapContainer) {
            strapContainer.innerHTML = PRESET_COLORS.map(color => `
                <div class="color-dot ${color === state.strapColor ? 'active' : ''}" 
                     style="background-color: ${color};" 
                     data-color="${color}"></div>
            `).join('');

            strapContainer.querySelectorAll('.color-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    strapContainer.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    state.strapColor = dot.getAttribute('data-color');
                    document.getElementById('strapCustomColor').value = state.strapColor;
                    document.getElementById('strapColorHex').textContent = state.strapColor.toUpperCase();
                    renderCanvas();
                });
            });
        }

        if (borderContainer) {
            borderContainer.innerHTML = PRESET_COLORS.map(color => `
                <div class="color-dot ${color === state.borderColor ? 'active' : ''}" 
                     style="background-color: ${color};" 
                     data-color="${color}"></div>
            `).join('');

            borderContainer.querySelectorAll('.color-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    borderContainer.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    state.borderColor = dot.getAttribute('data-color');
                    renderCanvas();
                });
            });
        }
    }

    // --- EVENT LISTENERS ---
    function initEventListeners() {
        // Tab switching
        document.querySelectorAll('.controls-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.controls-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content-container .tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-tab');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Width options
        document.querySelectorAll('[data-width]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-width]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.width = parseFloat(btn.getAttribute('data-width'));
                document.getElementById('summaryWidth').textContent = `${state.width} cm`;
                renderCanvas();
                updatePrices();
            });
        });

        // Material radio
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
                e.target.closest('.radio-card').classList.add('active');
                state.material = e.target.value;
                const matLabels = { poly: 'Polyester Gân', satin: 'Lụa Satin Bóng', eco: 'Tái Chế Eco-PET' };
                document.getElementById('summaryMaterial').textContent = matLabels[state.material];
                renderCanvas();
                updatePrices();
            });
        });

        // Custom color input
        const customColorInput = document.getElementById('strapCustomColor');
        if (customColorInput) {
            customColorInput.addEventListener('input', (e) => {
                state.strapColor = e.target.value;
                document.getElementById('strapColorHex').textContent = state.strapColor.toUpperCase();
                renderCanvas();
            });
        }

        // Text branding inputs
        const textInput = document.getElementById('lanyardText');
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                state.text = e.target.value || 'TAGLUXE STUDIO';
                renderCanvas();
            });
        }

        const fontSelect = document.getElementById('textFontSelect');
        if (fontSelect) {
            fontSelect.addEventListener('change', (e) => {
                state.textFont = e.target.value;
                renderCanvas();
            });
        }

        const textColorInput = document.getElementById('textColorInput');
        if (textColorInput) {
            textColorInput.addEventListener('input', (e) => {
                state.textColor = e.target.value;
                document.getElementById('textColorHex').textContent = state.textColor.toUpperCase();
                renderCanvas();
            });
        }

        // Logo upload
        const logoInput = document.getElementById('logoFileInput');
        if (logoInput) {
            logoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            state.logoImg = img;
                            document.getElementById('logoControls').style.display = 'flex';
                            renderCanvas();
                            showToast('Đã tải logo thành công!', 'success');
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const removeLogoBtn = document.getElementById('removeLogoBtn');
        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', () => {
                state.logoImg = null;
                document.getElementById('logoFileInput').value = '';
                document.getElementById('logoControls').style.display = 'none';
                renderCanvas();
            });
        }

        const repeatLogoCheck = document.getElementById('repeatLogoCheck');
        if (repeatLogoCheck) {
            repeatLogoCheck.addEventListener('change', (e) => {
                state.repeatLogo = e.target.checked;
                renderCanvas();
            });
        }

        // Hooks & Accessories
        document.querySelectorAll('.hook-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hook-opt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.hook = btn.getAttribute('data-hook');
                const hookNames = { lobster: 'Móc Khỉ Inox', oval: 'Móc Giọt Nước', bulldog: 'Móc Cá Sấu', keyring: 'Móc Vòng Tròn' };
                document.getElementById('summaryHook').textContent = hookNames[state.hook];
                renderCanvas();
                updatePrices();
            });
        });

        const safetyCheck = document.getElementById('safetyBreakawayCheck');
        if (safetyCheck) {
            safetyCheck.addEventListener('change', (e) => {
                state.safetyBreakaway = e.target.checked;
                document.getElementById('summarySafety').textContent = state.safetyBreakaway ? 'Có' : 'Không';
                renderCanvas();
                updatePrices();
            });
        }

        const quickCheck = document.getElementById('quickReleaseCheck');
        if (quickCheck) {
            quickCheck.addEventListener('change', (e) => {
                state.quickRelease = e.target.checked;
                renderCanvas();
                updatePrices();
            });
        }

        const badgeSelect = document.getElementById('badgeHolderSelect');
        if (badgeSelect) {
            badgeSelect.addEventListener('change', (e) => {
                state.badgeHolder = e.target.value;
                renderCanvas();
                updatePrices();
            });
        }

        // Canvas Tool Buttons
        const toggleCardBtn = document.getElementById('toggleCardBtn');
        if (toggleCardBtn) {
            toggleCardBtn.addEventListener('click', () => {
                state.showBadgeCard = !state.showBadgeCard;
                renderCanvas();
            });
        }

        const flipCanvasBtn = document.getElementById('flipCanvasBtn');
        if (flipCanvasBtn) {
            flipCanvasBtn.addEventListener('click', () => {
                state.isFlipped = !state.isFlipped;
                renderCanvas();
            });
        }

        const exportBtn = document.getElementById('exportMockupBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `Tagluxe_Lanyard_Mockup_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('Đã xuất file ảnh Mockup 2D thành công!', 'success');
            });
        }

        // Quantity Inputs
        const studioQtyInput = document.getElementById('studioQtyInput');
        if (studioQtyInput) {
            studioQtyInput.addEventListener('input', (e) => {
                state.quantity = Math.max(20, parseInt(e.target.value) || 20);
                updatePrices();
            });
        }

        document.getElementById('qtyMinusBtn')?.addEventListener('click', () => {
            state.quantity = Math.max(20, state.quantity - 10);
            if (studioQtyInput) studioQtyInput.value = state.quantity;
            updatePrices();
        });

        document.getElementById('qtyPlusBtn')?.addEventListener('click', () => {
            state.quantity += 10;
            if (studioQtyInput) studioQtyInput.value = state.quantity;
            updatePrices();
        });

        // Pricing Slider Section
        const pricingSlider = document.getElementById('pricingSlider');
        if (pricingSlider) {
            pricingSlider.addEventListener('input', (e) => {
                const qty = parseInt(e.target.value);
                document.getElementById('rangeQtyDisplay').textContent = `${qty} sợi`;
                document.getElementById('calcTotalQty').textContent = `${qty} sợi`;
                state.quantity = qty;
                if (studioQtyInput) studioQtyInput.value = qty;
                updatePrices();
            });
        }

        // Add to cart studio
        document.getElementById('addToCartStudioBtn')?.addEventListener('click', () => {
            addToCartCurrentDesign();
        });

        document.getElementById('pricingOrderBtn')?.addEventListener('click', () => {
            addToCartCurrentDesign();
            openCartModal();
        });

        // Cart Modal controls
        document.getElementById('openCartBtn')?.addEventListener('click', openCartModal);
        document.getElementById('closeCartBtn')?.addEventListener('click', closeCartModal);
        document.getElementById('cartOverlay')?.addEventListener('click', closeCartModal);

        // Mobile Nav Toggle
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            const nav = document.getElementById('mobileNav');
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
        });

        // Contact Form
        document.getElementById('contactForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('custName').value;
            showToast(`Cảm ơn ${name}! Tagluxe đã nhận thông tin và sẽ liên hệ Zalo ngay.`, 'success');
            e.target.reset();
        });
    }

    // --- CANVAS 2D RENDERER ENGINE ---
    function renderCanvas() {
        if (!ctx || !canvas) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background grid gradient
        const bgGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, 400);
        bgGrad.addColorStop(0, '#1e293b');
        bgGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate strap pixel width based on cm scale
        const strapPxWidth = Math.round(state.width * 14); // e.g. 1.5cm = 21px, 2.0cm = 28px, 2.5cm = 35px

        // --- DRAW STRAP NECK LOOP ---
        const topY = -40;
        const leftX = 150;
        const rightX = 400;
        const ringX = canvas.width / 2;
        const ringY = 270;

        ctx.save();

        // 1. Draw Left & Right Straps merging down
        drawStrapSegment(ctx, leftX, topY, ringX - 4, ringY, strapPxWidth);
        drawStrapSegment(ctx, rightX, topY, ringX + 4, ringY, strapPxWidth);

        // 2. Draw Safety Breakaway Buckle at top straps if enabled
        if (state.safetyBreakaway) {
            drawBreakawayBuckle(ctx, leftX + 35, topY + 90, strapPxWidth);
            drawBreakawayBuckle(ctx, rightX - 35, topY + 90, strapPxWidth);
        }

        // 3. Draw Main Hanging Double Strap from Ring down to Hook
        const hookY = 380;
        drawStrapSegment(ctx, ringX, ringY, ringX, hookY, strapPxWidth + 6);

        // 4. Draw Quick Release Buckle if enabled
        if (state.quickRelease) {
            drawQuickRelease(ctx, ringX, ringY + 55, strapPxWidth + 8);
        }

        // 5. Draw Metal Hook Attachment
        drawMetalHook(ctx, ringX, hookY, state.hook);

        // 6. Draw Badge Holder & ID Card if enabled
        if (state.showBadgeCard && state.badgeHolder !== 'none') {
            drawBadgeCardHolder(ctx, ringX, hookY + 42, state.badgeHolder);
        }

        ctx.restore();
    }

    // Helper: Draw Strap Segment with stitching & text repeat
    function drawStrapSegment(ctx, x1, y1, x2, y2, width) {
        ctx.save();

        // Path
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.strokeStyle = state.strapColor;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Stitching Border Lines
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width + 3;
        ctx.strokeStyle = state.borderColor;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw Text / Logo Along Strap
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        const len = Math.hypot(dx, dy);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        ctx.font = `700 ${Math.max(10, width - 12)}px ${state.textFont}`;
        ctx.fillStyle = state.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textStr = state.text;
        const textWidth = ctx.measureText(textStr).width + 60;

        if (state.repeatLogo) {
            for (let offset = 40; offset < len - 40; offset += textWidth) {
                if (state.logoImg) {
                    ctx.drawImage(state.logoImg, offset - textWidth/2, -width/3, width*0.7, width*0.7);
                    ctx.fillText(textStr, offset + width*0.5, 0);
                } else {
                    ctx.fillText(textStr, offset, 0);
                }
            }
        } else {
            ctx.fillText(textStr, len / 2, 0);
        }

        ctx.restore();
        ctx.restore();
    }

    // Helper: Draw Safety Breakaway
    function drawBreakawayBuckle(ctx, x, y, strapWidth) {
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - strapWidth/2 - 3, y - 8, strapWidth + 6, 16, 4);
        ctx.fill();
        ctx.stroke();
        
        // Notch line
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();
        ctx.restore();
    }

    // Helper: Draw Quick Release
    function drawQuickRelease(ctx, x, y, width) {
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - width/2 - 4, y - 12, width + 8, 24, 6);
        ctx.fill();
        ctx.stroke();

        // Release buttons
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x - width/2 - 7, y - 6, 3, 12);
        ctx.fillRect(x + width/2 + 4, y - 6, 3, 12);
        ctx.restore();
    }

    // Helper: Draw Metal Hook
    function drawMetalHook(ctx, x, y, hookType) {
        ctx.save();
        
        // Gradient metallic
        const metalGrad = ctx.createLinearGradient(x - 15, y, x + 15, y + 40);
        metalGrad.addColorStop(0, '#e2e8f0');
        metalGrad.addColorStop(0.5, '#94a3b8');
        metalGrad.addColorStop(1, '#475569');

        ctx.fillStyle = metalGrad;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;

        if (hookType === 'lobster') {
            // Ring
            ctx.beginPath();
            ctx.arc(x, y + 10, 10, 0, Math.PI * 2);
            ctx.stroke();

            // Hook body
            ctx.beginPath();
            ctx.arc(x, y + 26, 12, Math.PI, 0);
            ctx.lineTo(x + 12, y + 36);
            ctx.arc(x + 6, y + 36, 6, 0, Math.PI / 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = metalGrad;
            ctx.stroke();
        } else if (hookType === 'oval') {
            ctx.beginPath();
            ctx.ellipse(x, y + 20, 12, 18, 0, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = metalGrad;
            ctx.stroke();
        } else {
            // Bulldog / Keyring fallback
            ctx.beginPath();
            ctx.arc(x, y + 20, 16, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = metalGrad;
            ctx.stroke();
        }

        ctx.restore();
    }

    // Helper: Draw Badge Holder & Card Mockup
    function drawBadgeCardHolder(ctx, x, y, type) {
        const cardW = 160;
        const cardH = 220;
        const cardX = x - cardW / 2;
        const cardY = y;

        ctx.save();

        // 1. Holder Frame
        if (type === 'leather') {
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX - 8, cardY - 8, cardW + 16, cardH + 16, 12);
            ctx.fill();
            ctx.stroke();
        } else if (type === 'acrylic') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(cardX - 6, cardY - 6, cardW + 12, cardH + 12, 10);
            ctx.fill();
            ctx.stroke();
        } else {
            // PVC Clear
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX - 4, cardY - 4, cardW + 8, cardH + 8, 8);
            ctx.fill();
            ctx.stroke();
        }

        // Clip slot hole
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(x - 14, cardY - 2, 28, 8, 4);
        ctx.fill();

        // 2. ID Card Content
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY + 12, cardW, cardH - 16, 6);
        ctx.fill();

        // Header band
        const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
        headerGrad.addColorStop(0, '#6366f1');
        headerGrad.addColorStop(1, '#a855f7');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(cardX, cardY + 12, cardW, 45);

        // Company title
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 11px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAGLUXE MEMBER', x, cardY + 38);

        // Photo Avatar
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(x, cardY + 90, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Avatar icon
        ctx.fillStyle = '#64748b';
        ctx.font = '700 18px sans-serif';
        ctx.fillText('👤', x, cardY + 96);

        // Name & Position
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('NGUYỄN VĂN A', x, cardY + 132);

        ctx.fillStyle = '#6366f1';
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('VIP DELEGATE', x, cardY + 148);

        // QR Code Box mockup
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x - 18, cardY + 162, 36, 36);
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 8px monospace';
        ctx.fillText('▪️▫️▪️', x, cardY + 178);
        ctx.fillText('▫️▪️▫️', x, cardY + 188);

        ctx.restore();
    }

    // --- PRICE CALCULATOR ENGINE ---
    function updatePrices() {
        const qty = state.quantity;

        // Base price tier
        let basePrice = 25000;
        if (qty >= 50 && qty < 100) basePrice = 18000;
        else if (qty >= 100 && qty < 200) basePrice = 14000;
        else if (qty >= 200 && qty < 500) basePrice = 11500;
        else if (qty >= 500 && qty < 1000) basePrice = 9000;
        else if (qty >= 1000) basePrice = 7500;

        // Width addon
        let widthAddon = 0;
        if (state.width === 2.0) widthAddon = 1000;
        if (state.width === 2.5) widthAddon = 2000;

        // Material addon
        let matAddon = 0;
        if (state.material === 'satin') matAddon = 2000;
        if (state.material === 'eco') matAddon = 3000;

        // Accessories addon
        let accAddon = 0;
        if (state.safetyBreakaway) accAddon += 1500;
        if (state.quickRelease) accAddon += 2000;

        if (state.badgeHolder === 'acrylic') accAddon += 3000;
        if (state.badgeHolder === 'leather') accAddon += 8000;

        const unitPrice = basePrice + widthAddon + matAddon + accAddon;
        const totalPrice = unitPrice * qty;

        // Formatter
        const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

        // Update UI
        const unitDisplay = document.getElementById('unitPriceDisplay');
        const totalDisplay = document.getElementById('totalPriceDisplay');
        if (unitDisplay) unitDisplay.textContent = `${formatVND(unitPrice)}/sợi`;
        if (totalDisplay) totalDisplay.textContent = formatVND(totalPrice);

        // Pricing section UI
        const calcUnit = document.getElementById('calcUnitPrice');
        const calcTotal = document.getElementById('calcGrandTotal');
        if (calcUnit) calcUnit.textContent = `${formatVND(unitPrice)}/sợi`;
        if (calcTotal) calcTotal.textContent = `${formatVND(totalPrice)} VNĐ`;
    }

    // --- PRODUCTS CATALOG & GALLERY SHOWCASE ---
    function renderProductsCatalog() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const products = [
            {
                id: 'p1',
                title: 'Dây Đeo Thẻ Doanh Nghiệp VIP',
                category: 'corporate',
                tag: 'Bán chạy nhất',
                price: '11.500 đ',
                img: 'assets/images/hero.jpg',
                desc: 'In chuyển nhiệt 2 mặt sắc nét, bản rộng 2.0cm, đi kèm bao thẻ da PU 2 mặt cao cấp.'
            },
            {
                id: 'p2',
                title: 'Dây Đeo Thẻ Sinh Viên - UTE Edition',
                category: 'student',
                tag: 'UTE Startup',
                price: '9.000 đ',
                img: 'assets/images/gallery.jpg',
                desc: 'Thiết kế trẻ trung, chất liệu Polyester chống bám bẩn, tích hợp khóa an toàn chống giật.'
            },
            {
                id: 'p3',
                title: 'Dây Đeo Sự Kiện & Hội Thảo Premium',
                category: 'event',
                tag: 'Cao cấp',
                price: '14.000 đ',
                img: 'assets/images/card_mockup.jpg',
                desc: 'Vải lụa Satin bóng sang trọng, móc giọt nước xoay 360°, dập in lặp lại logo sự kiện.'
            },
            {
                id: 'p4',
                title: 'Bộ Thẻ Tên PVC 4 Lớp Chống Nước',
                category: 'corporate',
                tag: 'Bền bỉ 5 năm',
                price: '15.000 đ',
                img: 'assets/images/gallery.jpg',
                desc: 'Thẻ nhựa PVC cứng 4 lớp dập nóng, công nghệ in sắc nét chống xước & chống thấm nước 100%.'
            },
            {
                id: 'p5',
                title: 'Móc Khóa Acrylic / Mica In Theo Yêu Cầu',
                category: 'keychain',
                tag: 'Quà tặng HOT',
                price: '12.000 đ',
                img: 'assets/images/card_mockup.jpg',
                desc: 'Cắt laser mica trong suốt mọi hình dáng, in ấn 2 mặt rõ nét, đính móc khoen inox chắc chắn.'
            },
            {
                id: 'p6',
                title: 'Bao Thẻ Da PU 2 Mặt Chuyên Nghiệp',
                category: 'corporate',
                tag: 'Luxury',
                price: '18.000 đ',
                img: 'assets/images/hero.jpg',
                desc: 'Chất liệu da PU mềm mịn, đường may viền tinh tế, có ngăn đựng thẻ căn cước / thẻ xe tiện lợi.'
            }
        ];

        grid.innerHTML = products.map(item => `
            <div class="product-card" data-category="${item.category}">
                <div class="product-thumb">
                    <img src="${item.img}" alt="${item.title}">
                    <span class="product-tag">${item.tag}</span>
                </div>
                <div class="product-body">
                    <h3 class="product-title">${item.title}</h3>
                    <p class="product-desc">${item.desc}</p>
                    <div class="product-footer">
                        <span class="product-price">Từ ${item.price}</span>
                        <button class="btn btn-sm btn-primary load-preset-btn" data-id="${item.id}">
                            <i data-lucide="wand-2"></i> Tùy chỉnh ngay
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Filter button listeners
        document.querySelectorAll('.catalog-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.catalog-filters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.getAttribute('data-filter');
                document.querySelectorAll('.product-card').forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-category') === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Load preset to studio listener
        grid.querySelectorAll('.load-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const prod = products.find(p => p.id === id);
                if (prod) {
                    state.text = prod.title.toUpperCase();
                    document.getElementById('lanyardText').value = state.text;
                    renderCanvas();
                    updatePrices();
                    
                    // Smooth scroll to studio
                    document.getElementById('customizer').scrollIntoView({ behavior: 'smooth' });
                    showToast(`Đã tải mẫu "${prod.title}" vào Live Studio!`, 'success');
                }
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    // --- CART SYSTEM ---
    function addToCartCurrentDesign() {
        const item = {
            id: Date.now(),
            title: `Dây đeo thẻ Tagluxe ${state.width}cm`,
            width: state.width,
            material: state.material,
            text: state.text,
            strapColor: state.strapColor,
            quantity: state.quantity,
            totalPrice: parseInt(document.getElementById('totalPriceDisplay').textContent.replace(/[^\d]/g, '')) || 1400000
        };

        state.cart.push(item);
        updateCartBadge();
        showToast('Đã thêm bản thiết kế vào giỏ hàng!', 'success');
    }

    function updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = state.cart.length;
    }

    function openCartModal() {
        const modal = document.getElementById('cartModal');
        const container = document.getElementById('cartItemsContainer');
        const grandTotal = document.getElementById('cartGrandTotal');

        if (!modal || !container) return;

        if (state.cart.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <p>Giỏ hàng của bạn đang trống.</p>
                    <a href="#customizer" onclick="closeCartModal()" class="btn btn-sm btn-primary mt-2">Tạo thiết kế ngay</a>
                </div>
            `;
            if (grandTotal) grandTotal.textContent = '0 VNĐ';
        } else {
            let totalSum = 0;
            container.innerHTML = state.cart.map((item, idx) => {
                totalSum += item.totalPrice;
                return `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.title}</div>
                            <div class="cart-item-specs">Màu: ${item.strapColor} • Số lượng: ${item.quantity} sợi</div>
                            <div class="cart-item-specs">Nội dung in: "${item.text}"</div>
                            <div class="cart-item-price">${new Intl.NumberFormat('vi-VN').format(item.totalPrice)} đ</div>
                        </div>
                        <button class="icon-btn remove-cart-item" data-idx="${idx}"><i data-lucide="trash-2"></i></button>
                    </div>
                `;
            }).join('');

            if (grandTotal) grandTotal.textContent = `${new Intl.NumberFormat('vi-VN').format(totalSum)} VNĐ`;

            container.querySelectorAll('.remove-cart-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    state.cart.splice(idx, 1);
                    updateCartBadge();
                    openCartModal(); // Re-render
                });
            });
        }

        modal.classList.add('active');
        if (window.lucide) lucide.createIcons();
    }

    function closeCartModal() {
        const modal = document.getElementById('cartModal');
        if (modal) modal.classList.remove('active');
    }

    // --- TOAST NOTIFICATIONS ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
