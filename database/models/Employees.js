const mongoose = require("mongoose")
const moment = require('moment');

const ROLES = [
    'front desk',
    'manager'
]

const makeID = _ => Math.floor(Math.random() * 36**9).toString(36).padStart(9, '0').toUpperCase()
const OVERTIME_STARTS_AT = 40 // Hours for any given work week.

const EmployeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true
        },
        phone: {
            type: String,
            trim: true
        },
        role: {
            type: String,
            enum: ROLES
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        hourlyPay: {
            type: Number,
            required: true
        },
        activeShift: {
            type: Date,
            default: null,
            max: Date.now
        },
        workedShifts: [{
            date: {
                type: Date,
                required: true
            },
            weekOf: {
                type: String,
                required: true
            },
            clockedIn: {
                type: Date,
                default: null
            },
            clockedOut: {
                type: Date, 
                default: null
            },
            payRate: {
                type: Number,
                required: true
            }
        }],
        scheduledShifts: [{
            date: {
                type: Date,
                required: true
            },
            weekOf: {
                type: String,
                required: true
            },
            startDate: {
                type: Date,
                default: null
            },
            endDate: {
                type: Date,
                default: null
            }
        }]
    }
)

/**
 * Create a new employee record
 * @param {String} name The employee's name.
 * @param {String} phone The employee's phone number.
 * @param {String} role The employee's role within the company.
 * @param {moment} startDate The date the employee started with the company.
 * @param {Number} hourlyPay The employee's hourly pay rate.
 * @returns The newly created employee.
 */
EmployeeSchema.statics.add = function(name, phone, role, startDate, hourlyPay) {
    const employee = new this({name, phone, role, startDate, hourlyPay})
    employee.save()
    return employee
}

/**
 * Find all employees where any part of their name matches the input.
 * @param {String} name 
 * @returns A list of employees.
 */
EmployeeSchema.statics.findAllByName = function(name) {
    return this.where({ name: new RegExp(name, 'i') })
}

/**
 * Gets the week number for a given date.
 * @param {moment} date 
 * @returns The week number [e.g. "2021.08"]
 */
EmployeeSchema.methods.getWeekOf = function(date) {
    return date.format('GGGG.WW')
}

/**
 * Start the shift for this employee.
 * @param {moment} startTime 
 */
EmployeeSchema.methods.clockIn = function(startTime) {
    if (!this.activeShift) { // Checks that the employee is not already clocked in.
        this.activeShift = startTime // Stores the time that the employee clocked in. 
        console.info(`Employee ${this.name} [${this.id}] has clocked in.`)
    } else {
        console.error(`Employee ${this.name} [${this.id}] is was not able to clock in because they are already clocked in.`)
    }
}

/**
 * End the shift for this employee.
 * @param {moment} endTime 
 */
EmployeeSchema.methods.clockOut = function(endTime) {
    if (this.activeShift) {
        this.workedShifts.push({
            weekOf: this.getWeekOf(this.activeShift),
            clockedIn: this.activeShift,
            clockedOut: endTime,
            payRate: this.hourlyPay
        })
        this.activeShift = null
        console.info(`Employee ${this.name} [${this.id}] has clocked out.`)
    } else {
        console.error(`Employee ${this.name} [${this.id}] is was not able to clock out because they are already clocked out.`)
    }
}

/**
 * Get the pay number of hours worked durring a
 * @param {moment} date
 * @returns 
 */
EmployeeSchema.methods.getPayInfoForWeekOf = function(date) {
    const weekStart = date.startOf('week')
    const weekEnd = date.endOf('week')

    const normalHours = { count: 0, pay: 0 }
    const overtimeHours = { count: 0, pay: 0 }

    for (let shift of this.workedShifts) {
        const clockedIn = moment.utc(shift.clockIn)
        const clockedOut = moment.utc(shift.clockOut)
        const payRate = shift.payRate

        if (clockedIn.isBetween(weekStart, weekEnd, undefined, '[]')) {
            const duration = clockedOut.diff(clockedIn, 'hours', true)

            if (normalHours.count == OVERTIME_STARTS_AT) {
                overtimeHours.count += duration
                overtimeHours.pay += duration * payRate * 1.5
            } else
            if (normalHours.count + duration < OVERTIME_STARTS_AT) {
                normalHours.count += duration
                normalHours.pay += duration * payRate
            } else {
                const remainingNormal = OVERTIME_STARTS_AT - normalHours.count
                const remainingOvertime = normalHours.count + duration - OVERTIME_STARTS_AT

                normalHours.count += remainingNormal
                normalHours.pay += remainingNormal * payRate

                overtimeHours.count += remainingOvertime
                overtimeHours.pay += remainingOvertime * payRate * 1.5
            }
            sum += duration
        }
    }

    const totalHours = {
        count: normalHours.count + overtimeHours.count, 
        pay: normalHours.pay + overtimeHours.pay
    }

    return {
        normalHours,
        overtimeHours, 
        totalHours
    }
}

const Employee = mongoose.model("employee", EmployeeSchema)

module.exports = Employee