function toggleEntryForm() {
  const formContainer = document.getElementById('entry-form-container')
  formContainer.classList.toggle('visually-hidden')
  
  if (!formContainer.classList.contains('visually-hidden')) {
    setDefaultDateTime()
  }
}

function setDefaultDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`
  document.getElementById('entry-datetime').value = datetimeLocal
}

function formCollapseToggle(groupId) {
  const collapseButton = document.getElementById(`form-ac-group-${groupId}-collapse`)
  const collapseView = document.getElementById(`form-ac-group-${groupId}-items`)
  
  if (collapseButton.classList.contains('collapsed')) {
    collapseButton.classList.remove('collapsed')
    collapseView.classList.remove('visually-hidden')
  } else {
    collapseButton.classList.add('collapsed')
    collapseView.classList.add('visually-hidden')
  }
}

function showFormStatus(message, isError = false) {
  const statusElement = document.getElementById('form-status-message')
  statusElement.textContent = message
  statusElement.className = `ms-3 ${isError ? 'text-danger' : 'text-success'}`
  
  setTimeout(() => {
    statusElement.textContent = ''
    statusElement.className = 'ms-3 text-secondary'
  }, 5000)
}

function resetForm() {
  document.getElementById('new-entry-form').reset()
  document.querySelectorAll('.activity-checkbox').forEach(checkbox => {
    checkbox.checked = false
  })
  setDefaultDateTime()
}

async function handleFormSubmit(event) {
  event.preventDefault()
  
  const mood = parseInt(document.getElementById('entry-mood-select').value)
  const datetimeInput = document.getElementById('entry-datetime').value
  const noteTitle = document.getElementById('entry-note-title').value.trim()
  const noteText = document.getElementById('entry-note-text').value.trim()
  
  const selectedActivities = Array.from(document.querySelectorAll('.activity-checkbox:checked'))
    .map(checkbox => parseInt(checkbox.value))
  
  if (!datetimeInput) {
    showFormStatus('Please select a date and time', true)
    return
  }
  
  if (isNaN(mood)) {
    showFormStatus('Please select a mood', true)
    return
  }
  
  const datetime = new Date(datetimeInput).getTime()
  
  const entryData = {
    mood: mood,
    datetime: datetime,
    note_title: noteTitle,
    note: noteText,
    tags: selectedActivities
  }
  
  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create entry')
    }
    
    const createdEntry = await response.json()
    
    showFormStatus('Entry created successfully!')
    resetForm()
    toggleEntryForm()
    
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    showFormStatus(`Error: ${error.message}`, true)
  }
}

function initEntryFormListeners() {
  const toggleButton = document.getElementById('toggle-entry-form')
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleEntryForm)
  }
  
  const cancelButton = document.getElementById('cancel-entry-form')
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      resetForm()
      toggleEntryForm()
    })
  }
  
  const form = document.getElementById('new-entry-form')
  if (form) {
    form.addEventListener('submit', handleFormSubmit)
  }
  
  document.querySelectorAll('.form-ac-group-header').forEach(header => {
    header.addEventListener('click', function() {
      formCollapseToggle(header.dataset.groupId)
    })
  })
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEntryFormListeners)
  } else {
    initEntryFormListeners()
  }
}
