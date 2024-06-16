// Function to get the existing list from the server via GET request
const getList = async () => {
    try {
        let url = 'http://127.0.0.1:5000/aas_list';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch AAS list');
        }
        const data = await response.json();
        const aasList = data['Asset Administration Shells'];
        renderAasList(aasList);
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Erro ao carregar lista de AAS. Verifique o console para mais detalhes.');
    }
};

// Function to delete an item from the server list via DELETE request
const deleteAAS = async (aas_id) => {
    if (confirm("Are you sure you want to delete this AAS?")) {
        try {
            let url = `http://127.0.0.1:5000/aas?aas_id=${encodeURIComponent(aas_id)}`;
            const response = await fetch(url, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to delete AAS');
            }
            getList();
            fillAasIdSelect();
            showNotification('success', 'Asset Administration Shell deleted successfully!');
        } catch (error) {
            console.error('Error deleting AAS. Try again later.', error);
            showNotification('error', 'Error.');
        }
    }
};

// Function to add a new item with the data provided by the user
const newItem = async () => {
    let aas_id = document.getElementById("aas_id").value;
    let id_short = document.getElementById("id_short").value;
    let asset_kind = document.getElementById("asset_kind").value;
    let global_asset_id = document.getElementById("global_asset_id").value;
    let version = document.getElementById("version").value;
    let revision = document.getElementById("revision").value;
    let description = document.getElementById("description").value;

    if (!aas_id || !id_short || !asset_kind || !global_asset_id) {
        alert("Please fill in all required fields!");
        return;
    }

    try {
        await postItem(aas_id, id_short, asset_kind, global_asset_id, version, revision, description);
    } catch (error) {
        console.error('Error creating AAS:', error);
        showNotification('error', error.message || 'Error adding item. Check the console for more details.');
    } finally {
        getList();
        fillAasIdSelect();
    }
};

// Function to display alerts on the interface
const showNotification = (type, message) => {
    const notificationContainer = document.getElementById('notification-container');
    const notificationBox = document.createElement('div');
    notificationBox.className = `notification ${type}`;
    notificationBox.innerHTML = `
        ${message}
        <span class="close-btn material-icons" onclick="this.parentElement.style.display='none';">close</span>
    `;
    notificationContainer.appendChild(notificationBox);

    setTimeout(() => {
        notificationBox.classList.add('hide');
        setTimeout(() => {
            notificationBox.remove();
        }, 500);
    }, 5000);
};

// Function to render the list of AAS on the interface
const renderAasList = (aasList) => {
    const aasListContainer = document.getElementById('aasList');
    aasListContainer.innerHTML = '';

    aasList.sort((a, b) => a.aas_id.localeCompare(b.aas_id)).forEach(aas => {
        const aasCard = document.createElement('div');
        aasCard.className = 'aas-card';
        aasCard.innerHTML = `
            <h3>${aas.aas_id}</h3>
            <div class="card-buttons">
                <button class="view-more-btn" onclick="toggleView('${aas.aas_id}', this)">View More</button>
                <button class="delete-btn" onclick="deleteAAS('${aas.aas_id}')">Delete</button>
            </div>
            <div class="aas-details" style="display: none;">
                <p><strong>ID Short:</strong> ${aas.id_short}</p>
                <p><strong>Asset Kind:</strong> ${aas.asset_kind}</p>
                <p><strong>Global Asset ID:</strong> ${aas.global_asset_id}</p>
                <p><strong>Version:</strong> ${aas.version}</p>
                <p><strong>Revision:</strong> ${aas.revision}</p>
                <p><strong>Description:</strong> ${aas.description}</p>
            </div>
        `;
        aasListContainer.appendChild(aasCard);
    });
};

// Function to populate the select with the existing AAS IDs
const fillAasIdSelect = async () => {
    const url = 'http://127.0.0.1:5000/aas_list';

    try {
        const response = await fetch(url);
        const data = await response.json();

        const aasId = data['Asset Administration Shells'].map(aas => aas.aas_id);
        aasId.sort();

        const aasIdSelect = document.getElementById("update_aas_id");
        aasIdSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select --';
        aasIdSelect.appendChild(defaultOption);

        aasId.forEach(aasId => {
            const option = document.createElement('option');
            option.value = aasId;
            option.textContent = aasId;
            aasIdSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error populating AAS IDs list. Check the console for more details.');
    }
};

// Function to populate the update form with the data of the selected AAS
const fillUpdateForm = async () => {
    const updateAasIdElement = document.getElementById('update_aas_id');
    const selectedAasId = updateAasIdElement.value;

    if (!selectedAasId) {
        clearUpdateForm();
        return;
    }

    try {
        const aasData = await fetchAASByAasId(selectedAasId);
        if (aasData) {
            document.getElementById('update_aas_id_short').value = aasData.id_short || '';
            document.getElementById('update_asset_kind').value = aasData.asset_kind || '';
            document.getElementById('update_global_asset_id').value = aasData.global_asset_id || '';
            document.getElementById('update_version').value = aasData.version || '';
            document.getElementById('update_revision').value = aasData.revision || '';
            document.getElementById('update_description').value = aasData.description || '';
        } else {
            clearUpdateForm();
        }
    } catch (error) {
        console.error('Error filling update form:', error);
        showNotification('error', 'Error populating update form. Check the console for more details.');
        clearUpdateForm();
    }
};

// Function to clear update form fields
const clearUpdateForm = () => {
    document.getElementById('update_aas_id_short').value = '';
    document.getElementById('update_asset_kind').value = 'Type';
    document.getElementById('update_global_asset_id').value = '';
    document.getElementById('update_version').value = '';
    document.getElementById('update_revision').value = '';
    document.getElementById('update_description').value = '';
};

// Function to fetch data of an AAS by its aas_id
const fetchAASByAasId = async (aas_id) => {
    const url = `http://127.0.0.1:5000/aas?aas_id=${encodeURIComponent(aas_id)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch AAS data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching AAS data:', error);
        throw error;
    }
};

// Function to add an AAS to the list via POST request
const postItem = async (aas_id, id_short, asset_kind, global_asset_id, version, revision, description) => {
    const formData = new FormData();
    formData.append('aas_id', aas_id);
    formData.append('id_short', id_short);
    formData.append('asset_kind', asset_kind);
    formData.append('global_asset_id', global_asset_id);
    formData.append('version', version);
    formData.append('revision', revision);
    formData.append('description', description);

    try {
        let url = 'http://127.0.0.1:5000/aas';
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        getList();
        showNotification('success', 'Asset Administration Shell created successfully!');
        fillAasIdSelect();
    } catch (error) {
        console.error('Error sending data:', error);
        showNotification('error', error.message || 'Error creating Asset Administration Shell. Check the console for more details.');
    }
};

// Function to update an item in the list
const updateItem = async () => {
    const aas_id = document.getElementById("update_aas_id").value;
    const id_short = document.getElementById("update_aas_id_short").value;
    const asset_kind = document.getElementById("update_asset_kind").value;
    const global_asset_id = document.getElementById("update_global_asset_id").value;
    const version = document.getElementById("update_version").value;
    const revision = document.getElementById("update_revision").value;
    const description = document.getElementById("update_description").value;

    if (!aas_id) {
        alert("Select an AAS to update!");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('aas_id', aas_id);
        formData.append('id_short', id_short);
        formData.append('asset_kind', asset_kind);
        formData.append('global_asset_id', global_asset_id);
        formData.append('version', version);
        formData.append('revision', revision);
        formData.append('description', description);

        let url = `http://127.0.0.1:5000/aas?aas_id=${encodeURIComponent(aas_id)}`;
        const response = await fetch(url, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        document.getElementById("update_aas_id_short").value = '';
        document.getElementById("update_asset_kind").value = '';
        document.getElementById("update_global_asset_id").value = '';
        document.getElementById("update_version").value = '';
        document.getElementById("update_revision").value = '';
        document.getElementById("update_description").value = '';
        document.getElementById("update_aas_id").value = '';

        getList();
        showNotification('success', 'Asset Administration Shell updated successfully!');
        fillAasIdSelect();

    } catch (error) {
        console.error('Error sending data:', error);
        showNotification('error', error.message || 'Error creating Asset Administration Shell. Check the console for more details.');
    }
};

// Function to show/hide details of an AAS
const toggleView = (aas_id, button) => {
    const detailsDiv = button.parentNode.nextElementSibling;
    const buttonText = button.textContent.trim();

    if (buttonText === 'View More') {
        detailsDiv.style.display = 'block';
        button.textContent = 'View Less';
    } else {
        detailsDiv.style.display = 'none';
        button.textContent = 'View More';
    }
};

// Load the list of AAS upon page initialization
window.onload = () => {
    getList();
    fillAasIdSelect();
};
