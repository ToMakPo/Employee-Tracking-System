/// GET EMPLOYESS ///
const employeeTable = $('#employeeTable')
const filters = {}
const sort = {}
const pager = {
    limit: 30,
    page: 0
}

async function buildEmployeeTable() {
    const employees = await $.get('/api/employees', {filters, sort, pager})
    
    employeeTable.html('')

    const tableHeader = $('<tr>')
    employeeTable.append(tableHeader)

    const headers = ['Name', 'Phone Number', 'Role', 'Start Date', 'End Date', 'On Shift', 'Edit']
    headers.forEach(header => {
        const columnName = $('<th>').text(header)
        tableHeader.append(columnName)
    })
    
    employees
        .forEach(employee => {
            const row = $('<tr>')
                .on('click', event => {
                    event.preventDefault(),
                    
                    window.location.href = `/${employee._id}`
                })
            employeeTable.append(row)

            const nameCol = $('<td>').text(employee.name)
            row.append(nameCol)

            const phoneCol = $('<td>').text(employee.phone)
            row.append(phoneCol)

            const roleCol = $('<td>').text(employee.role)
            row.append(roleCol)

            employee.startDate = moment(employee.startDate)
            const startCol = $('<td>').text(employee.startDate.format('YYYY/MM/DD'))
            row.append(startCol)

            employee.endDate = employee.endDate ? moment(employee.endDate) : null
            const endCol = $('<td>').text(employee.endDate ? employee.endDate.format('YYYY/MM/DD') : '')
            row.append(endCol)

            const onShiftCol = $('<td>').text(employee.activeShift ? '✓' : '')
            row.append(onShiftCol)

            const editCol = $('<td>').append(
                $('<button>')
                    .addClass('edit_employee_button')
                    .text('✎')
                    .on('click', event => {
                        event.preventDefault()
                        event.stopPropagation() 

                        showEditEmployeeModal(employee)
                    })
            )
            row.append(editCol)
        }
    )
}

buildEmployeeTable()

/// EDIT EMPLOYEE ///
const editEmployeeModal = $('#editEmployeeModal')
const editEmployeeModal_nameInput = $('#editEmployeeModal [name=name]')
const editEmployeeModal_phoneInput = $('#editEmployeeModal [name=phone]')
const editEmployeeModal_roleInput = $('#editEmployeeModal [name=role]')
const editEmployeeModal_startDateInput = $('#editEmployeeModal [name=startDate]')
const editEmployeeModal_endDateInput = $('#editEmployeeModal [name=endDate]')
const editEmployeeModal_hourlyPayInput = $('#editEmployeeModal [name=hourlyPay]')
const editEmployeeModal_saveButton = $('#editEmployeeModal [name=save]')

let selectedEmployee = null

function showEditEmployeeModal(employee) {
    editEmployeeModal_nameInput.val(employee.name).focus().select()
    editEmployeeModal_phoneInput.val(employee.phone)
    editEmployeeModal_roleInput.val(employee.role)
    editEmployeeModal_startDateInput.val(moment(employee.startDate).format('YYYY-MM-DD'))
    editEmployeeModal_endDateInput.val(employee.endDate ? moment(employee.endDate).format('YYYY-MM-DD') : null)
    editEmployeeModal_hourlyPayInput.val(employee.hourlyPay)

    showModal(editEmployeeModal)
    selectedEmployee = employee
}

function changesMade(newValues) {
    const changes = {}
    for (let key of Object.keys(newValues)) {
        if (newValues[key] instanceof moment) {
            const changeMade = newValues[key].isSame(selectedEmployee[key])
            if (changeMade) {
                changes[key] = newValues[key]
            }
        } else {
            const changeMade = newValues[key] != selectedEmployee[key]
            if (changeMade) {
                changes[key] = newValues[key]
            }
        }
    }
    return changes
}

editEmployeeModal_saveButton.on('click', async event => {
    event.preventDefault()

    const newValues = {
        name: editEmployeeModal_nameInput.val() || null,
        phone: editEmployeeModal_phoneInput.val() || null,
        role: editEmployeeModal_roleInput.val() || null,
        startDate: moment(editEmployeeModal_startDateInput.val()) || null,
        endDate: moment(editEmployeeModal_endDateInput.val()) || null,
        hourlyPay: editEmployeeModal_hourlyPayInput.val() || null
    }

    const changes = changesMade(newValues)

    if (Object.keys(changes).length === 0) {
        console.error('Could not update employee because no changes were made.')
        return
    }

    if (newValues.name == null) {
        editEmployeeModal_nameInput.focus()
        console.error('You need to edit a name for the employee.')
        return
    }

    if (newValues.role == null) {
        editEmployeeModal_roleInput.focus()
        console.error('You need to edit a role for the employee.')
        return
    }

    if (newValues.startDate == null) {
        editEmployeeModal_startDateInput.focus()
        console.error('You need to edit a start date for the employee.')
        return
    }

    if (newValues.hourlyPay == null) {
        editEmployeeModal_hourlyPayInput.focus()
        console.error('You need to edit an hourly pay rate for the employee.')
        return
    }

    const data = await $.post('/api/employees/update', {_id: selectedEmployee._id, changes})
    
    hideModal(editEmployeeModal)
    buildEmployeeTable()
})

/// ADD EMPLOYEE ///
const addEmployeeButton = $('#addEmployeeButton')

const addEmployeeModal = $('#addEmployeeModal')
const addEmployeeModal_nameInput = $('#addEmployeeModal [name=name]')
const addEmployeeModal_phoneInput = $('#addEmployeeModal [name=phone]')
const addEmployeeModal_roleInput = $('#addEmployeeModal [name=role]')
const addEmployeeModal_startDateInput = $('#addEmployeeModal [name=startDate]')
const addEmployeeModal_hourlyPayInput = $('#addEmployeeModal [name=hourlyPay]')
const addEmployeeModal_saveButton = $('#addEmployeeModal [name=save]')

addEmployeeButton.on('click', event => {
    addEmployeeModal.addClass('show')
})

addEmployeeModal_saveButton.on('click', async event => {
    event.preventDefault()

    newValues = {
        name: addEmployeeModal_nameInput.val() || null, 
        phone: addEmployeeModal_phoneInput.val() || null, 
        role: addEmployeeModal_roleInput.val() || null, 
        startDate: addEmployeeModal_startDateInput.val() || null, 
        hourlyPay: addEmployeeModal_hourlyPayInput.val() || null
    }

    if (newValues.name == null) {
        addEmployeeModal_nameInput.focus()
        console.error('You need to add a name for the employee.')
        return
    }

    if (newValues.role == null) {
        addEmployeeModal_roleInput.focus()
        console.error('You need to add a role for the employee.')
        return
    }

    if (newValues.startDate == null) {
        addEmployeeModal_startDateInput.focus()
        console.error('You need to add a start date for the employee.')
        return
    }

    if (newValues.hourlyPay == null) {
        addEmployeeModal_hourlyPayInput.focus()
        console.error('You need to add an hourly pay rate for the employee.')
        return
    }

    const data = await $.post('/api/employees/insert', newValues)
    
    hideModal(addEmployeeModal)
    buildEmployeeTable()
})

/// SCHEDULED INFO ///
const calendarInputs = $('.calendarInput')
const splitTime = time => time != '' ? time.split(':') : null

const employeeId = location.href.split('/').pop()

calendarInputs.each(function() {
    const input = $(this)
    const row = input.closest('tr')
    const id = row.data('id')
    const state = input.data('state')
    const date = moment(row.data('date'))

    const value = splitTime(input.val().split(':'))
    const other = splitTime(row.find(`[data-state=${state == 'start' ? 'end' : 'start'}]`)[0].value.split(':'))

    const start = state == 'start' ? value : other
    const end = state == 'end' ? value : other

    let startDate = start ? date.clone().add(start[0], 'hours').add(start[1], 'minutes') : null
    let endDate = end ? date.clone().add(end[0], 'hours').add(end[1], 'minutes') : null

    if (startDate && endDate && startDate.isAfter(endDate)) {
        endDate.add(1, 'day')
    }

    const display = $(input.siblings()[0])

    input.on('change', function() {
        console.log(this.value)
        display.text(this.value)

        if (id) {
            $.post('/api/schedule/update', { employeeId, id, startDate, endDate })
        } else {
            $.post('/api/test', { employeeId, startDate, endDate })
            // $.post('/api/schedule/insert', { employeeId, startDate, endDate })
        }
    })
})

/// MODALS ///
// Add a close button to all modals.
$('.modal').each(function() {
    const button = $('<button class="modal_close_button">✕</button>')
    $($(this).children('form')[0]).append(button)
})

$('.modal [name=cancel], .modal_close_button').each(function() {
    const button = $(this)
    const modal = button.closest('.modal')

    button.on('click', event => {
        event.preventDefault()
        hideModal(modal)
    })
})

function clearModal(modal) {
    const form = $(modal.children('form')[0])

    $(modal.children('form')[0])
        .find('input')
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false)
}

function showModal(modal) {
    modal.addClass('show')
}

function hideModal(modal) {
    modal.removeClass('show')
    clearModal(modal)
}
