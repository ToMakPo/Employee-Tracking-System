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
                    
                    location.href = `/${employee._id}`
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

/// CALENDAR INFO ///
const calendarInputs = $('.calendarInput')

const employeeId = new URL(location.href).pathname.substring(1)

const hourDisplays = {
    scheduled: $('#scheduledInfo .hoursColumn.display'),
    worked: $('#workedInfo .hoursColumn.display')
}
const hourTotal = {
    scheduled: $($('#scheduledInfo .hoursColumn.total.hours')[0]),
    worked: $($('#workedInfo .hoursColumn.total.hours')[0])
}
const selectedWeek = {
    scheduled: $($('#scheduledInfo .hoursColumn.total.hours')[0]),
    worked: $($('#workedInfo .hoursColumn.total.hours')[0])
}

$('.weekSelector button')
    .click(async function(event) {
        event.preventDefault()
        
        const currentDate = moment($(this).closest('section').attr('data-date'))
        const delta = $(this).hasClass('nextWeek') ? 1 : -1
        const newDate = currentDate.add(delta, 'week')

        const section = $(this).closest('section').attr('id').replace('Info', '')

        const url = new URL(location.href)
        url.searchParams.set(`${section}Date`, newDate.format('YYYY-MM-DD'))

        location.href = url.toString()
    })


calendarInputs.each(function() {
    const thisInput = $(this)
    const section = thisInput.closest('section').attr('id').replace('Info', '')
    const row = thisInput.closest('tr')
    const date = moment(row.attr('data-date'))
    const state = thisInput.attr('data-state')
    const otherInput = $(row.find(`[data-state=${state == 'start' ? 'end' : 'start'}]`)[0])
    const hourInput = $(row.find(`.hoursColumn`)[0])

    const display = $(thisInput.siblings()[0])

    thisInput.blur(async function() {
        if (thisInput.val() == thisInput.attr('data-current')) return
        thisInput.attr('data-current', thisInput.val())

        display.text(thisInput.val() || '-')

        const dateValue = date.format()
        const startTime = state == 'start' ? thisInput.val() : otherInput.val()
        const endTime = state == 'end' ? thisInput.val() : otherInput.val()

        const shiftId = row.attr('data-id')
        const action = shiftId ? 'update' : 'insert'
        const url = `/api/${section}/${action}`
        const package = { employeeId, shiftId, dateValue, startTime, endTime }

        if (section == 'worked') {
            const payRateInput = row.find('.payRateInput')
            const payRateDisplay = row.find('.payRateDisplay')

            if (action == 'insert') {
                let payRate = thisInput.closest('section').attr('data-hourlyPay') * 1
                payRateInput
                    .attr('data-current', payRate)
                    .val(payRate.toFixed(2))
                payRateDisplay
                    .text(payRate.toFixed(2))
            }

            package.payRate = payRateInput.attr('data-current') * 1
        }
        
        const data = await $.post(url, package)
        
        if (data.action == 'insert') {
            row.attr('data-id', data.shiftId)
        }

        hourInput
            .text(data.hours.toFixed(2))
            .attr('data-count', data.hours)

        let sum = 0

        hourDisplays[section].each(function() {
            sum += $(this).attr('data-count') * 1
        })

        hourTotal[section].text(parseFloat(sum).toFixed(2))
    })
})

/// MODALS ///
// Add a close button to all modals.
$('.modal').each(function() {
    const button = $('<button class="modalCloseButton">✕</button>')
    $($(this).children('form')[0]).append(button)
})

$('.modal [name=cancel], .modalCloseButton').each(function() {
    const button = $(this)
    const modal = button.closest('.modal')

    button.on('click', event => {
        event.preventDefault()
        hideModal(modal)
    })
})

$('.modal form button[name=delete]').each(function() {
    const button = $(this)
    const modal = button.closest('.modal')

    button.on('click', async event => {
        event.preventDefault()

        const data = await $.post('/api/employees/delete/', {_id: selectedEmployee._id})

        hideModal(modal)
        buildEmployeeTable()
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
