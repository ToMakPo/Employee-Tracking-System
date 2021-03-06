const {Employees} = require('./database/connect')
const moment = require('moment');

function getWeekOf(date) {
    return date.clone().add(1, 'day').format('GGGG.WW')
}

async function buildEmployeeView(employeeId, scheduledDate, workedDate) {    
    const employee = await Employees.findById(employeeId)
    if (employee == null) return null

    const scheduledShifts = {}
    const scheduledStartOfWeek = scheduledDate.clone().startOf('week')
    const scheduledWeekOf = getWeekOf(scheduledDate)
    let scheduledHours = 0

    for (let d = 0; d < 7; d++) {
        const date = scheduledStartOfWeek.clone().add(d, 'days')
        scheduledShifts[date.format('MMM-DD')] = {
            id: '',
            date: date.format('YYYY-MM-DD'),
            dateDisplay: date.format('MMM D'),
            dow: date.format('dddd'),
            start: '',
            end: '',
            hours: 0
        }
    }

    for (let shift of employee.scheduledShifts) {
        if (shift.weekOf == scheduledWeekOf) {
            const date = moment.utc(shift.date).format('MMM-DD')
            const startDate = shift.startDate ? moment.utc(shift.startDate) : null
            const endDate = shift.endDate ? moment.utc(shift.endDate) : null
            const hours = (startDate && endDate) ? endDate.diff(startDate, 'hours', true) : 0
            
            scheduledShifts[date].id = shift._id
            scheduledShifts[date].start = startDate ? startDate.format('HH:mm') : ''
            scheduledShifts[date].end = endDate ? endDate.format('HH:mm') : ''
            scheduledShifts[date].hours = hours
            scheduledHours += hours
        }
    }

    const workedShifts = {}
    const workedStartOfWeek = workedDate.clone().startOf('week')
    const workedWeekOf = getWeekOf(workedDate)
    let totalPay = 0
    let workedHours = 0

    for (let d = 0; d < 7; d++) {
        const date = workedStartOfWeek.clone().add(d, 'days')
        workedShifts[date.format('MMM-DD')] = {
            id: '',
            date: date.format('YYYY-MM-DD'),
            dateDisplay: date.format('MMM D'),
            dow: date.format('dddd'),
            start: '',
            end: '',
            payRate: null,
            hours: 0
        }
    }

    const OVERTIME = 40
    const OT_RATE = 1.5

    for (let shift of employee.workedShifts) {
        if (shift.weekOf == workedWeekOf) {
            const date = moment.utc(shift.date).format('MMM-DD')
            const startDate = shift.clockedIn ? moment.utc(shift.clockedIn) : null
            const endDate = shift.clockedOut ? moment.utc(shift.clockedOut) : null
            const hours = (startDate && endDate) ? endDate.diff(startDate, 'hours', true) : 0
            const payRate = shift.payRate
            
            workedShifts[date].id = shift._id
            workedShifts[date].start = startDate ? startDate.format('HH:mm') : ''
            workedShifts[date].end = endDate ? endDate.format('HH:mm') : ''
            workedShifts[date].payRate = payRate
            workedShifts[date].hours = hours
            
            if (workedHours + hours < OVERTIME) {
                totalPay += hours * payRate
            } else 
            if (workedHours > OVERTIME) {
                totalPay += hours * payRate * OT_RATE
            } else {
                const rnh = OVERTIME - workedHours
                const rot = hours - rnh

                totalPay += rnh * payRate
                totalPay += rot * payRate * OT_RATE
            }

            workedHours += hours
        }
    }

    return {
        name: employee.name,
        phone: employee.phone ? employee.phone.match(/^(\d{3})(\d{3})(\d{4})$/).join('-').substring(11) : '___-___-____',
        role: employee.role,
        startDate: employee.startDate ? moment.utc(employee.startDate).format('YYYY-MM-DD') : '',
        endDate: employee.endDate ? moment.utc(employee.endDate).format('YYYY-MM-DD') : '',
        onShift: employee.activeShift ? true : false,
        scheduled: {
            startOfWeek: scheduledDate.startOf('week').format('MMM Do, YYYY'),
            endOfWeek: scheduledDate.endOf('week').format('MMM Do, YYYY'),
            shifts: scheduledShifts,
            hours: scheduledHours
        },
        worked: {
            startOfWeek: workedDate.startOf('week').format('MMM Do, YYYY'),
            endOfWeek: workedDate.endOf('week').format('MMM Do, YYYY'),
            shifts: workedShifts,
            totalPay,
            hours: workedHours
        }
    }
}

module.exports = function(app) {
    app.get('/', function (req, res) {
        res.render('home')
    })
    app.get('/:id', async function (req, res) {
        const id = req.params.id
        const scheduleDate = moment.utc()
        const workedDate = moment.utc()

        const employeeView = await buildEmployeeView(id, scheduleDate, workedDate)

        if (employeeView) {
            res.render('employee', employeeView)
        } else {
            res.render('noEmployee')
        }
    })
}