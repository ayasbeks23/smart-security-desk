const cameraList = document.querySelector('#cameraList');
const incidentList = document.querySelector('#incidentList');
const statusFilter = document.querySelector('#statusFilter');
const incidentForm = document.createElement('form');

incidentForm.innerHTML = `
  <h3>Создать новый инцидент</h3>
  <input id="incidentTitle" placeholder="Название инцидента" required>
  <input id="incidentCamera" placeholder="Номер камеры (например CAM-01)" required>
  <select id="incidentSeverity">
    <option value="low">Низкий приоритет</option>
    <option value="medium">Средний приоритет</option>
    <option value="high">Высокий приоритет</option>
  </select>
  <textarea id="incidentDescription" placeholder="Описание инцидента" required></textarea>
  <button type="submit">Создать инцидент</button>
`;

incidentList.before(incidentForm);

incidentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await api('/api/incidents', {
      method: 'POST',
      body: JSON.stringify({
        title: document.querySelector('#incidentTitle').value,
        cameraId: document.querySelector('#incidentCamera').value,
        severity: document.querySelector('#incidentSeverity').value,
        description: document.querySelector('#incidentDescription').value,
      }),
    });

    incidentForm.reset();
    await loadIncidents();
    alert('Инцидент успешно создан!');
  } catch (error) {
    alert(error.message);
  }
});
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

async function loadCameras() {
  const cameras = await api('/api/cameras');

  cameraList.innerHTML = cameras
    .map(
      (camera) => `
    <article class="card">
      <h3>${camera.name}</h3>
      <p>Номер: ${camera.id}</p>
      <p>Местоположение: ${camera.location}</p>
      <p class="${camera.status}">
        Статус: ${camera.status}
      </p>
    </article>
  `
    )
    .join('');
}

async function loadIncidents() {
  const status = statusFilter.value;
  const url = status ? `/api/incidents?status=${status}` : '/api/incidents';

  const incidents = await api(url);

  incidentList.innerHTML = incidents
    .map(
      (item) => `
    <article class="incident">
      <h3>${item.title}</h3>
      <p>Камера: ${item.cameraId}</p>
      <p>Приоритет: ${item.severity}</p>
      <p>Статус: ${item.status}</p>
      <p>${item.description}</p>
      <button onclick="changeStatus('${item.id}', 'in_progress')">
        Взять в работу
      </button>
      <button onclick="changeStatus('${item.id}', 'resolved')">
        Решить
      </button>
    </article>
  `
    )
    .join('');

  if (incidents.length === 0) {
    incidentList.innerHTML = '<p>Инцидентов пока нет.</p>';
  }
}

async function changeStatus(id, status) {
  try {
    await api(`/api/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    loadIncidents();
  } catch (error) {
    alert(error.message);
  }
}

statusFilter.addEventListener('change', loadIncidents);

async function init() {
  try {
    await loadCameras();
    await loadIncidents();
  } catch (error) {
    console.error(error);
    alert('Ошибка загрузки данных: ' + error.message);
  }
}

init();
