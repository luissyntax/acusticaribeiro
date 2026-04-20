/**
 * Gera PDF da ficha técnica (portas) a partir do template #ar-pdf-sheet.
 * Carrega html2canvas e jsPDF sob demanda (CDN).
 */
(function () {
    var BTN_ID = 'ar-pdf-ficha-btn';
    var SHEET_ID = 'ar-pdf-sheet';

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = function () {
                resolve();
            };
            s.onerror = function () {
                reject(new Error('Falha ao carregar: ' + src));
            };
            document.head.appendChild(s);
        });
    }

    function getJsPdfConstructor() {
        if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            return window.jspdf.jsPDF;
        }
        throw new Error('jsPDF não está disponível.');
    }

    function ensureLibs() {
        if (window.html2canvas && window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            return Promise.resolve();
        }
        var chain = Promise.resolve();
        if (!window.html2canvas) {
            chain = chain.then(function () {
                return loadScript(
                    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
                );
            });
        }
        if (!window.jspdf) {
            chain = chain.then(function () {
                return loadScript(
                    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
                );
            });
        }
        return chain;
    }

    function waitImages(root) {
        var imgs = root.querySelectorAll('img');
        var promises = Array.prototype.map.call(imgs, function (img) {
            if (img.complete && img.naturalWidth) {
                return Promise.resolve();
            }
            return new Promise(function (resolve) {
                img.addEventListener('load', function () {
                    resolve();
                });
                img.addEventListener('error', function () {
                    resolve();
                });
            });
        });
        return Promise.all(promises);
    }

    function downloadPdf() {
        var btn = document.getElementById(BTN_ID);
        var sheet = document.getElementById(SHEET_ID);
        if (!sheet || !btn) {
            return;
        }

        var label = btn.textContent;
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.textContent = 'Gerando PDF…';

        ensureLibs()
            .then(function () {
                return waitImages(sheet);
            })
            .then(function () {
                return document.fonts.ready;
            })
            .then(function () {
                return window.html2canvas(sheet, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#0a0a0a',
                    scrollX: 0,
                    scrollY: 0,
                });
            })
            .then(function (canvas) {
                var JsPDF = getJsPdfConstructor();
                var pdf = new JsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true,
                });
                var pageW = pdf.internal.pageSize.getWidth();
                var pageH = pdf.internal.pageSize.getHeight();
                var imgData = canvas.toDataURL('image/jpeg', 0.92);
                var ratio = canvas.height / canvas.width;
                var w = pageW;
                var h = w * ratio;
                var x = 0;
                if (h > pageH) {
                    h = pageH;
                    w = pageH / ratio;
                    x = (pageW - w) / 2;
                }
                pdf.addImage(imgData, 'JPEG', x, 0, w, h, undefined, 'FAST');

                pdf.save('acustica-ribeiro-ficha-portas-acusticas.pdf');
            })
            .catch(function (err) {
                console.error(err);
                window.alert(
                    'Não foi possível gerar o PDF. Verifique a conexão, abra o site por http(s) na mesma pasta das imagens e tente de novo.'
                );
            })
            .finally(function () {
                btn.disabled = false;
                btn.removeAttribute('aria-busy');
                btn.textContent = label;
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById(BTN_ID);
        if (btn) {
            btn.addEventListener('click', downloadPdf);
        }
    });
})();
