let dataPoints = [];
        
        // Memunculkan dialog file input saat tombol "Pilih File" diklik
        function selectFile() {
            document.getElementById('fileInput').click();
        }
        
        // Membuat tabel input data manual dengan 4 baris awal
        function createTable() {
            const table = document.getElementById('dataTable');
            const tbody = document.getElementById('tableBody');
            
            // Hapus semua baris lama
            tbody.innerHTML = '';
            
            // Tambahkan 4 baris kosong
            for (let i = 0; i < 4; i++) {
                const row = tbody.insertRow();
                const xCell = row.insertCell(0);
                const yCell = row.insertCell(1);
                
                xCell.innerHTML = `<input type="number" class="form-input" style="margin: 0; padding: 8px;" placeholder="x${i+1}" step="0.01">`;
                yCell.innerHTML = `<input type="number" class="form-input" style="margin: 0; padding: 8px;" placeholder="y${i+1}" step="0.01">`;
            }
            
            table.style.display = 'table';
            updateDataStatus('Manual input ready', 4);
        }
        
        // Mengupdate status data dan jumlah data pada tampilan
        function updateDataStatus(status, count) {
            document.getElementById('dataStatus').textContent = status;
            document.getElementById('dataCount').textContent = count;
            
            const indicator = document.querySelector('.status-indicator');
            if (count > 0) {
                indicator.className = 'status-indicator status-ready';
            } else {
                indicator.className = 'status-indicator status-none';
            }
        }
        
        // Mengambil data x dan y dari tabel input
        function collectTableData() {
            const table = document.getElementById('dataTable');
            if (table.style.display === 'none') return [];
            
            const inputs = table.querySelectorAll('input');
            const points = [];
            
            for (let i = 0; i < inputs.length; i += 2) {
                const x = parseFloat(inputs[i].value);
                const y = parseFloat(inputs[i + 1].value);
                
                if (!isNaN(x) && !isNaN(y)) {
                    points.push([x, y]);
                }
            }
            
            return points;
        }
        
        // Menghitung hasil prediksi berdasarkan data dan input x
        function calculatePrediction() {
            const predictionInput = document.getElementById('predictionInput').value;
            const resultDiv = document.getElementById('predictionResult');
            
            if (!predictionInput) {
                resultDiv.innerHTML = `
                    <div style="color: #e74c3c;">
                        ⚠️ Error: Masukkan nilai x untuk prediksi
                    </div>
                `;
                return;
            }
            
            // Ambil data dari tabel
            dataPoints = collectTableData();
            
            if (dataPoints.length < 2) {
                resultDiv.innerHTML = `
                    <div style="color: #e74c3c;">
                        ⚠️ Error: Minimal 2 titik data diperlukan untuk prediksi
                    </div>
                `;
                return;
            }
            
            const x = parseFloat(predictionInput);
            
            // Hitung prediksi dengan interpolasi Newton-Gregory (atau Lagrange)
            const result = newtonGregoryPrediction(dataPoints, x);
            
            resultDiv.innerHTML = `
                <div style="color: #27ae60; margin-bottom: 15px;">
                    <strong>✅ Prediksi Berhasil!</strong>
                </div>
                <div style="background: rgba(255,255,255,0.8); padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <strong>Nilai x:</strong> ${x}<br>
                    <strong>Prediksi y:</strong> ${result.toFixed(4)}<br>
                    <strong>Metode:</strong> Newton-Gregory Forward Difference
                </div>
                <div style="font-size: 0.9rem; color: #666;">
                    Menggunakan ${dataPoints.length} titik data untuk interpolasi
                </div>
            `;
            
            updateDataStatus(`${dataPoints.length} data points loaded`, dataPoints.length);
            updateChart(x, result);
        }
        
        // Melakukan interpolasi Newton-Gregory (atau Lagrange jika >2 titik)
        function newtonGregoryPrediction(points, x) {
            // Urutkan data berdasarkan x
            points.sort((a, b) => a[0] - b[0]);
            
            if (points.length === 2) {
                // Interpolasi linear jika hanya 2 titik
                const [x1, y1] = points[0];
                const [x2, y2] = points[1];
                return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
            }
            
            // Jika lebih dari 2 titik, gunakan Lagrange
            let result = 0;
            const n = points.length;
            
            for (let i = 0; i < n; i++) {
                let term = points[i][1];
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        term *= (x - points[j][0]) / (points[i][0] - points[j][0]);
                    }
                }
                result += term;
            }
            
            return result;
        }
        
        // Mengupdate grafik visualisasi data dan kurva prediksi
        function updateChart(predictedX = null, predictedY = null) {
            const chartContainer = document.getElementById('chartContainer');
            
            if (dataPoints.length === 0) {
                chartContainer.innerHTML = `
                    <div>
                        <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
                        <div>Grafik akan ditampilkan setelah data diinput dan prediksi dihitung</div>
                    </div>
                `;
                return;
            }
            
            // Buat grafik SVG
            createSVGChart(chartContainer, dataPoints, predictedX, predictedY);
        }
        
        // Membuat grafik SVG dari data dan kurva prediksi
        function createSVGChart(container, points, predictedX = null, predictedY = null) {
            const width = 800;
            const height = 400;
            const margin = { top: 40, right: 40, bottom: 60, left: 60 };
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;
            
            // Hitung rentang nilai
            const xValues = points.map(p => p[0]);
            const yValues = points.map(p => p[1]);
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);
            
            // Tambah padding pada rentang
            const xRange = maxX - minX || 1;
            const yRange = maxY - minY || 1;
            const xPadding = xRange * 0.1;
            const yPadding = yRange * 0.1;
            
            const xMin = minX - xPadding;
            const xMax = maxX + xPadding;
            const yMin = minY - yPadding;
            const yMax = maxY + yPadding;
            
            // Fungsi skala
            const scaleX = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
            const scaleY = (y) => margin.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
            
            // Generate prediction curve points
            const predictionPoints = [];
            const step = (xMax - xMin) / 50;
            for (let x = xMin; x <= xMax; x += step) {
                const y = newtonGregoryPrediction(points, x);
                predictionPoints.push([x, y]);
            }
            
            // Create SVG
            let svg = `
                <svg width="${width}" height="${height}" style="background: white; border-radius: 10px;">
                    <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                        </linearGradient>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:0.1" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Grid lines -->
            `;
            
            // Garis kisi vertikal
            for (let i = 0; i <= 10; i++) {
                const x = margin.left + (i / 10) * chartWidth;
                svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartHeight}" stroke="#e1e8ed" stroke-width="1" opacity="0.5"/>`;
            }
            
            // Garis kisi horizontal
            for (let i = 0; i <= 8; i++) {
                const y = margin.top + (i / 8) * chartHeight;
                svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#e1e8ed" stroke-width="1" opacity="0.5"/>`;
            }
            
            // Draw prediction curve
            if (predictionPoints.length > 1) {
                let pathD = `M ${scaleX(predictionPoints[0][0])} ${scaleY(predictionPoints[0][1])}`;
                for (let i = 1; i < predictionPoints.length; i++) {
                    pathD += ` L ${scaleX(predictionPoints[i][0])} ${scaleY(predictionPoints[i][1])}`;
                }
                svg += `<path d="${pathD}" stroke="url(#gradient1)" stroke-width="3" fill="none" opacity="0.8"/>`;
            }
            
            // Draw data points
            points.forEach((point, index) => {
                const cx = scaleX(point[0]);
                const cy = scaleY(point[1]);
                svg += `
                    <circle cx="${cx}" cy="${cy}" r="8" fill="url(#gradient1)" stroke="white" stroke-width="3">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="${index * 0.2}s"/>
                    </circle>
                    <text x="${cx}" y="${cy - 15}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#2c3e50">
                        (${point[0]}, ${point[1]})
                    </text>
                `;
            });

            // Jika titik prediksi tersedia, gambarkan titiknya
            if (predictedX !== null && predictedY !== null) {
                const cx = scaleX(predictedX);
                const cy = scaleY(predictedY);
                svg += `
                    <circle cx="${cx}" cy="${cy}" r="10" fill="red" stroke="white" stroke-width="3">
                        <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <text x="${cx}" y="${cy - 15}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="red">
                        (${predictedX.toFixed(2)}, ${predictedY.toFixed(2)})
                    </text>
                `;
            }
            
            // Draw axes
            svg += `
                <!-- X-axis -->
                <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#2c3e50" stroke-width="2"/>
                <!-- Y-axis -->
                <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#2c3e50" stroke-width="2"/>
                
                <!-- X-axis labels -->
                <text x="${margin.left + chartWidth/2}" y="${height - 10}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#2c3e50">X Values</text>
                <!-- Y-axis labels -->
                <text x="20" y="${margin.top + chartHeight/2}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#2c3e50" transform="rotate(-90 20 ${margin.top + chartHeight/2})">Y Values</text>
                
                <!-- Title -->
                <text x="${width/2}" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#2c3e50">Newton-Gregory Polynomial Interpolation</text>
            `;
            
            // Add scale labels
            for (let i = 0; i <= 5; i++) {
                const x = xMin + (i / 5) * (xMax - xMin);
                const xPos = scaleX(x);
                svg += `<text x="${xPos}" y="${margin.top + chartHeight + 20}" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">${x.toFixed(1)}</text>`;
            }
            
            for (let i = 0; i <= 5; i++) {
                const y = yMin + (i / 5) * (yMax - yMin);
                const yPos = scaleY(y);
                svg += `<text x="${margin.left - 10}" y="${yPos + 4}" text-anchor="end" font-family="Arial" font-size="11" fill="#666">${y.toFixed(1)}</text>`;
            }
            
            svg += '</svg>';
            
            container.innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; margin: 0;">📈 Grafik Interpolasi Polinomial Newton-Gregory</h3>
                        <p style="color: #666; margin: 5px 0;">Data points (●) dan kurva prediksi interpolasi</p>
                    </div>
                    ${svg}
                    <div style="margin-top: 20px; display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 20px; height: 20px; background: linear-gradient(135deg, red); border-radius: 50%; border: 3px solid white;"></div>
                            <span style="color: #2c3e50; font-weight: 500;">Data Results</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; border: 3px solid white;"></div>
                            <span style="color: #2c3e50; font-weight: 500;">Data Points</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 20px; height: 3px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 2px;"></div>
                            <span style="color: #2c3e50; font-weight: 500;">Interpolation Curve</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; color: #2c3e50;">
                        <strong>📊 Statistik:</strong> 
                        ${points.length} data points | 
                        X range: [${xMin.toFixed(2)}, ${xMax.toFixed(2)}] | 
                        Y range: [${yMin.toFixed(2)}, ${yMax.toFixed(2)}]
                    </div>
                </div>
            `;
        }
        
        // Handler untuk file input (placeholder, belum parsing file)
        document.getElementById('fileInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.name.endsWith('.csv')) {
                    Papa.parse(file, {
                        complete: function(results) {
                            const data = results.data;
                            // Hapus baris lama
                            const tbody = document.getElementById('tableBody');
                            tbody.innerHTML = '';
                            let count = 0;
                            data.forEach(row => {
                                // Pastikan baris valid dan bukan header
                                if (row.length >= 2 && !isNaN(row[0]) && !isNaN(row[1])) {
                                    const tr = tbody.insertRow();
                                    tr.insertCell(0).innerHTML = `<input type="number" class="form-input" value="${row[0]}" step="0.01">`;
                                    tr.insertCell(1).innerHTML = `<input type="number" class="form-input" value="${row[1]}" step="0.01">`;
                                    count++;
                                }
                            });
                            document.getElementById('dataTable').style.display = 'table';
                            updateDataStatus(`File: ${file.name} (CSV loaded)`, count);
                        }
                    });
                } else {
                    updateDataStatus(`File: ${file.name} (format tidak didukung)`, 0);
                }
            }
        });
        
        // Inisialisasi status data saat halaman dimuat
        updateDataStatus('File: tidak ada', 0);
        
        // Mengekspor hasil prediksi dan data ke file PDF
        function exportPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Ambil hasil prediksi
            const resultDiv = document.getElementById('predictionResult');
            // Ambil nilai x prediksi
            const xVal = document.getElementById('predictionInput').value;
            // Ambil data tabel
            const points = collectTableData();

            let y = 15;
            doc.setFontSize(16);
            doc.text("Hasil Prediksi Polinomial Newton-Gregory", 10, y);
            y += 10;
            doc.setFontSize(12);
            doc.text(`Tanggal: ${new Date().toLocaleString()}`, 10, y);
            y += 10;
            doc.text(`Nilai x prediksi: ${xVal || '-'}`, 10, y);
            y += 10;
            doc.text("Data (X, Y):", 10, y);
            y += 7;
            points.forEach((p, i) => {
                doc.text(`  ${i + 1}. (${p[0]}, ${p[1]})`, 12, y);
                y += 7;
            });
            y += 5;
            const match = resultDiv.innerText.match(/Prediksi y:\s*([0-9.\-]+)/);
            const prediksiY = match ? match[1] : '-';
            doc.text(`Hasil Prediksi y: ${prediksiY}`, 10, y);
            y += 10;
            doc.text("Metode: Newton-Gregory Forward Difference", 10, y);

            // Ambil elemen grafik
            const chartDiv = document.getElementById('chartContainer');
            // Scroll ke grafik agar bisa di-capture dengan benar
            chartDiv.scrollIntoView();

            // Gunakan html2canvas untuk mengambil gambar grafik
            html2canvas(chartDiv, {backgroundColor: "#fff"}).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                // Tambahkan halaman baru untuk grafik
                doc.addPage();
                doc.setFontSize(14);
                doc.text("Grafik Data dan Prediksi:", 10, 20);
                // Atur ukuran gambar agar proporsional di PDF
                let imgWidth = 180;
                let imgHeight = canvas.height * imgWidth / canvas.width;
                if (imgHeight > 120) imgHeight = 120;
                doc.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
                doc.save("hasil_prediksi.pdf");
            });
        }
        
        // Menambah baris baru pada tabel input data
        function addRow() {
            const table = document.getElementById('dataTable');
            const tbody = document.getElementById('tableBody');
            
            const row = tbody.insertRow();
            const xCell = row.insertCell(0);
            const yCell = row.insertCell(1);
            
            xCell.innerHTML = `<input type="number" class="form-input" style="margin: 0; padding: 8px;" placeholder="x${tbody.rows.length}" step="0.01">`;
            yCell.innerHTML = `<input type="number" class="form-input" style="margin: 0; padding: 8px;" placeholder="y${tbody.rows.length}" step="0.01">`;
            
            updateDataStatus('Manual input ready', tbody.rows.length);
        }
        
        // Menghapus baris terakhir pada tabel input data
        function removeRow() {
            const table = document.getElementById('dataTable');
            const tbody = document.getElementById('tableBody');
            
            if (tbody.rows.length > 0) {
                tbody.deleteRow(tbody.rows.length - 1);
                updateDataStatus('Manual input ready', tbody.rows.length);
            }
        }