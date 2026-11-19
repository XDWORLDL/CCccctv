let inspections = [
    { id: 1, nomor_unit: 'KDTSM07', pelaksanaan_inspeksi: '2026-08-11', temuan: 'BERFUNGSI NORMAL', rekomendasi: 'WEEKLY CHECK', pic_dic: 'YUSUF', due_date: '2026-09-10', status: 'CLOSE', tgl_perbaikan: null, img_temuan: null, img_perbaikan: null },
    { id: 2, nomor_unit: 'KDTSM08', pelaksanaan_inspeksi: '2026-08-11', temuan: 'BERFUNGSI NORMAL', rekomendasi: 'WEEKLY CHECK', pic_dic: 'YUSUF', due_date: '2026-09-10', status: 'CLOSE', tgl_perbaikan: null, img_temuan: null, img_perbaikan: null },
    { id: 3, nomor_unit: 'KDTSM09', pelaksanaan_inspeksi: '2026-08-11', temuan: 'BERFUNGSI NORMAL', rekomendasi: 'WEEKLY CHECK', pic_dic: 'YUSUF', due_date: '2026-09-10', status: 'CLOSE', tgl_perbaikan: null, img_temuan: null, img_perbaikan: null },
  ];

  let nextId = 4;
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  if (localStorage.getItem('cctv_inspections')) {
    try {
      inspections = JSON.parse(localStorage.getItem('cctv_inspections'));
      nextId = inspections.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
    } catch (e) {}
  }

  function saveData() {
    try {
      localStorage.setItem('cctv_inspections', JSON.stringify(inspections));
    } catch (e) {
      showToast('Penyimpanan penuh. Hapus beberapa data atau kurangi ukuran gambar.', 'warning');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Router
  function navigateTo(route) {
    window.location.hash = route;
  }

  function handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const [path, param] = hash.slice(2).split('/');
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.route === path) {
        link.classList.add('active');
      }
    });

    // Show appropriate page
    switch(path) {
      case 'dashboard':
        document.getElementById('page-dashboard').classList.add('active');
        renderDashboard();
        break;
      case 'inspections':
        document.getElementById('page-inspections').classList.add('active');
        renderInspections();
        break;
      case 'add':
        document.getElementById('page-add').classList.add('active');
        document.getElementById('addForm').reset();
        removeImage('add_file_temuan', 'add_preview_temuan', 'add_label_temuan');
        removeImage('add_file_perbaikan', 'add_preview_perbaikan', 'add_label_perbaikan');
        break;
      case 'edit':
        document.getElementById('page-edit').classList.add('active');
        if (param) loadEditForm(parseInt(param));
        break;
      case 'detail':
        document.getElementById('page-detail').classList.add('active');
        if (param) renderDetail(parseInt(param));
        break;
      case 'about':
        document.getElementById('page-about').classList.add('active');
        break;
      default:
        navigateTo('dashboard');
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }

  window.addEventListener('hashchange', handleRoute);

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  }

  // Render Functions
  function updateSummary() {
    const open = inspections.filter(i => i.status === 'OPEN').length;
    const close = inspections.filter(i => i.status === 'CLOSE').length;
    const total = inspections.length;
    const achieve = total > 0 ? Math.round((close / total) * 100) : 0;

    document.getElementById('stat-open').textContent = open;
    document.getElementById('stat-close').textContent = close;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-achieve').textContent = achieve + '%';
  }

  function renderDashboard() {
    updateSummary();
    const tbody = document.getElementById('dashboardTableBody');
    tbody.innerHTML = '';

    if (inspections.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Tidak ada data</td></tr>`;
      return;
    }

    inspections.slice(0, 10).forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="row-number">${index + 1}</td>
        <td><strong>${item.nomor_unit}</strong></td>
        <td>${formatDate(item.pelaksanaan_inspeksi)}</td>
        <td><span class="status-badge status-${item.status}">${item.status}</span></td>
        <td>${item.pic_dic}</td>
        <td>${formatDate(item.due_date)}</td>
        <td class="action-cell">
          <a href="#/detail/${item.id}" class="btn btn-sm btn-view"><i class="fa-solid fa-eye"></i> Detail</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderInspections() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('filterStatus').value;

    const filtered = inspections.filter(item => {
      const matchSearch = item.nomor_unit.toLowerCase().includes(search) || 
                         item.pic_dic.toLowerCase().includes(search);
      const matchFilter = filter === '' || item.status === filter;
      return matchSearch && matchFilter;
    });

    const tbody = document.getElementById('inspectionsTableBody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12" class="empty-state">Tidak ada data ditemukan</td></tr>`;
      return;
    }

    filtered.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="row-number">${index + 1}</td>
        <td><strong>${item.nomor_unit}</strong></td>
        <td>${formatDate(item.pelaksanaan_inspeksi)}</td>
        <td>${item.temuan}</td>
        <td>
          ${item.img_temuan ? 
            `<img src="${item.img_temuan}" class="img-preview" onclick="openLightbox('${item.img_temuan}')">` :
            `<div class="cctv-placeholder"><div class="scan-line"></div><div class="dot"></div></div>`
          }
        </td>
        <td>${item.rekomendasi}</td>
        <td>${item.pic_dic}</td>
        <td>${formatDate(item.due_date)}</td>
        <td><span class="status-badge status-${item.status}">${item.status}</span></td>
        <td>${formatDate(item.tgl_perbaikan)}</td>
        <td>
          ${item.img_perbaikan ? 
            `<img src="${item.img_perbaikan}" class="img-preview" onclick="openLightbox('${item.img_perbaikan}')">` :
            `<span class="na-text">N/A</span>`
          }
        </td>
        <td class="action-cell">
          <a href="#/detail/${item.id}" class="btn btn-sm btn-view" aria-label="Lihat detail" title="Detail"><i class="fa-solid fa-eye"></i></a>
          <a href="#/edit/${item.id}" class="btn btn-sm btn-edit" aria-label="Edit data" title="Edit"><i class="fa-solid fa-pen-to-square"></i></a>
          <button class="btn btn-sm btn-delete" onclick="deleteItem(${item.id})" aria-label="Hapus data" title="Hapus"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderDetail(id) {
    const item = inspections.find(i => i.id === id);
    if (!item) {
      document.getElementById('detailContent').innerHTML = '<p class="empty-state">Data tidak ditemukan</p>';
      return;
    }

    document.getElementById('detailContent').innerHTML = `
      <div class="detail-grid">
        <div class="detail-card">
          <h3><i class="fa-solid fa-clipboard-list"></i> Informasi Inspeksi</h3>
          <div class="detail-item">
            <div class="label">Nomor Unit</div>
            <div class="value">${item.nomor_unit}</div>
          </div>
          <div class="detail-item">
            <div class="label">Tanggal Inspeksi</div>
            <div class="value">${formatDate(item.pelaksanaan_inspeksi)}</div>
          </div>
          <div class="detail-item">
            <div class="label">Temuan Ketidaksesuaian</div>
            <div class="value">${item.temuan}</div>
          </div>
          <div class="detail-item">
            <div class="label">Rekomendasi Tindakan</div>
            <div class="value">${item.rekomendasi}</div>
          </div>
        </div>

        <div class="detail-card">
          <h3><i class="fa-solid fa-user-check"></i> PIC & Status</h3>
          <div class="detail-item">
            <div class="label">PIC / DIC</div>
            <div class="value">${item.pic_dic}</div>
          </div>
          <div class="detail-item">
            <div class="label">Due Date</div>
            <div class="value">${formatDate(item.due_date)}</div>
          </div>
          <div class="detail-item">
            <div class="label">Status Perbaikan</div>
            <div class="value"><span class="status-badge status-${item.status}">${item.status}</span></div>
          </div>
          <div class="detail-item">
            <div class="label">Tanggal Perbaikan</div>
            <div class="value">${formatDate(item.tgl_perbaikan)}</div>
          </div>
        </div>

        <div class="detail-card">
          <h3><i class="fa-solid fa-camera"></i> Dokumentasi Temuan</h3>
          ${item.img_temuan ? 
            `<img src="${item.img_temuan}" class="detail-image" onclick="openLightbox('${item.img_temuan}')">` :
            `<p class="na-text">Tidak ada gambar</p>`
          }
        </div>

        <div class="detail-card">
          <h3><i class="fa-solid fa-screwdriver-wrench"></i> Dokumentasi Perbaikan</h3>
          ${item.img_perbaikan ? 
            `<img src="${item.img_perbaikan}" class="detail-image" onclick="openLightbox('${item.img_perbaikan}')">` :
            `<p class="na-text">Tidak ada gambar</p>`
          }
        </div>
      </div>

      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <a href="#/edit/${item.id}" class="btn btn-lime"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
        <button class="btn btn-delete" onclick="deleteItem(${item.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
      </div>
    `;
  }

  // Form Handlers
  document.getElementById('addForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fileTemuan = document.getElementById('add_file_temuan').files[0];
    const filePerbaikan = document.getElementById('add_file_perbaikan').files[0];

    const data = {
      id: nextId++,
      nomor_unit: document.getElementById('add_nomor_unit').value.trim(),
      pelaksanaan_inspeksi: document.getElementById('add_pelaksanaan_inspeksi').value,
      temuan: document.getElementById('add_temuan').value.trim(),
      rekomendasi: document.getElementById('add_rekomendasi').value.trim(),
      pic_dic: document.getElementById('add_pic_dic').value.trim(),
      due_date: document.getElementById('add_due_date').value,
      status: document.getElementById('add_status_perbaikan').value,
      tgl_perbaikan: document.getElementById('add_tanggal_perbaikan').value || null,
      img_temuan: null,
      img_perbaikan: null,
    };

    let loaded = 0;
    const totalFiles = (fileTemuan ? 1 : 0) + (filePerbaikan ? 1 : 0);

    if (totalFiles === 0) {
      inspections.push(data);
      saveData();
      showToast(`Data ${data.nomor_unit} berhasil ditambahkan`);
      navigateTo('inspections');
      return;
    }

    if (fileTemuan) {
      const reader = new FileReader();
      reader.onload = function(e) {
        data.img_temuan = e.target.result;
        loaded++;
        if (loaded === totalFiles) {
          inspections.push(data);
          saveData();
          showToast(`Data ${data.nomor_unit} berhasil ditambahkan`);
          navigateTo('inspections');
        }
      };
      reader.readAsDataURL(fileTemuan);
    }

    if (filePerbaikan) {
      const reader = new FileReader();
      reader.onload = function(e) {
        data.img_perbaikan = e.target.result;
        loaded++;
        if (loaded === totalFiles) {
          inspections.push(data);
          saveData();
          showToast(`Data ${data.nomor_unit} berhasil ditambahkan`);
          navigateTo('inspections');
        }
      };
      reader.readAsDataURL(filePerbaikan);
    }
  });

  function loadEditForm(id) {
    const item = inspections.find(i => i.id === id);
    if (!item) {
      showToast('Data tidak ditemukan', 'error');
      navigateTo('inspections');
      return;
    }

    document.getElementById('edit_id').value = item.id;
    document.getElementById('edit_nomor_unit').value = item.nomor_unit;
    document.getElementById('edit_pelaksanaan_inspeksi').value = item.pelaksanaan_inspeksi;
    document.getElementById('edit_temuan').value = item.temuan;
    document.getElementById('edit_rekomendasi').value = item.rekomendasi;
    document.getElementById('edit_pic_dic').value = item.pic_dic;
    document.getElementById('edit_due_date').value = item.due_date;
    document.getElementById('edit_status_perbaikan').value = item.status;
    document.getElementById('edit_tanggal_perbaikan').value = item.tgl_perbaikan || '';

    if (item.img_temuan) {
      const preview = document.getElementById('edit_preview_temuan');
      const label = document.getElementById('edit_label_temuan');
      preview.querySelector('img').src = item.img_temuan;
      preview.classList.add('show');
      label.classList.add('has-file');
      label.innerHTML = '<i class="fa-solid fa-circle-check"></i> Gambar tersimpan';
    }

    if (item.img_perbaikan) {
      const preview = document.getElementById('edit_preview_perbaikan');
      const label = document.getElementById('edit_label_perbaikan');
      preview.querySelector('img').src = item.img_perbaikan;
      preview.classList.add('show');
      label.classList.add('has-file');
      label.innerHTML = '<i class="fa-solid fa-circle-check"></i> Gambar tersimpan';
    }
  }

  document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit_id').value);
    const existing = inspections.find(i => i.id === id);
    if (!existing) return;

    const fileTemuan = document.getElementById('edit_file_temuan').files[0];
    const filePerbaikan = document.getElementById('edit_file_perbaikan').files[0];

    const data = {
      nomor_unit: document.getElementById('edit_nomor_unit').value.trim(),
      pelaksanaan_inspeksi: document.getElementById('edit_pelaksanaan_inspeksi').value,
      temuan: document.getElementById('edit_temuan').value.trim(),
      rekomendasi: document.getElementById('edit_rekomendasi').value.trim(),
      pic_dic: document.getElementById('edit_pic_dic').value.trim(),
      due_date: document.getElementById('edit_due_date').value,
      status: document.getElementById('edit_status_perbaikan').value,
      tgl_perbaikan: document.getElementById('edit_tanggal_perbaikan').value || null,
      img_temuan: existing.img_temuan,
      img_perbaikan: existing.img_perbaikan,
    };

    let loaded = 0;
    const totalFiles = (fileTemuan ? 1 : 0) + (filePerbaikan ? 1 : 0);

    if (totalFiles === 0) {
      const index = inspections.findIndex(i => i.id === id);
      if (index !== -1) {
        inspections[index] = { ...inspections[index], ...data };
        saveData();
        showToast(`Data ${data.nomor_unit} berhasil diperbarui`, 'info');
        navigateTo('inspections');
      }
      return;
    }

    if (fileTemuan) {
      const reader = new FileReader();
      reader.onload = function(e) {
        data.img_temuan = e.target.result;
        loaded++;
        if (loaded === totalFiles) saveEdit(id, data);
      };
      reader.readAsDataURL(fileTemuan);
    }

    if (filePerbaikan) {
      const reader = new FileReader();
      reader.onload = function(e) {
        data.img_perbaikan = e.target.result;
        loaded++;
        if (loaded === totalFiles) saveEdit(id, data);
      };
      reader.readAsDataURL(filePerbaikan);
    }
  });

  function saveEdit(id, data) {
    const index = inspections.findIndex(i => i.id === id);
    if (index !== -1) {
      inspections[index] = { ...inspections[index], ...data };
      saveData();
      showToast(`Data ${data.nomor_unit} berhasil diperbarui`, 'info');
      navigateTo('inspections');
    }
  }

  function deleteItem(id) {
    const item = inspections.find(i => i.id === id);
    if (!item) return;
    if (confirm(`Yakin ingin menghapus "${item.nomor_unit}"?`)) {
      inspections = inspections.filter(i => i.id !== id);
      saveData();
      showToast(`Data ${item.nomor_unit} berhasil dihapus`, 'error');
      handleRoute();
    }
  }

  // Image Functions
  function previewImage(input, previewId, labelId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    const label = document.getElementById(labelId);

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`File terlalu besar! Maksimal 2MB`, 'warning');
        input.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar!', 'warning');
        input.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        preview.querySelector('img').src = e.target.result;
        preview.classList.add('show');
        label.classList.add('has-file');
        label.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + file.name;
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage(inputId, previewId, labelId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewId).classList.remove('show');
    document.getElementById(labelId).classList.remove('has-file');
    document.getElementById(labelId).innerHTML = '<i class="fa-solid fa-folder-open"></i> Klik untuk upload gambar (Max 2MB)';
  }

  function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('active');
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
  }

  // Search & Filter
  document.getElementById('searchInput').addEventListener('input', renderInspections);
  document.getElementById('filterStatus').addEventListener('change', renderInspections);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
  });

  // Init
  handleRoute();