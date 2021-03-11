require('console-stamp')(console, { pattern: 'HH:MM:ss.l', label: false })
const request = require('request')
const chalk = require('chalk')
const Discord = require('discord.js')

const test = new Discord.WebhookClient('x', 'x') //Discord webhook information

let delay = 25000 // Delay between checks in milliseconds
let days = 21 // Total days in the future to check

// Fill this with all the provider locations found by searching zocdoc (check readme)
let locations = [
    'pr_t0QhtMhl-EmOOjyx8Iz9wx|lo_4NEHSgf8iEu8V74AiA46WR'
]

monitor()

setInterval(function () {
    monitor()
}, delay)

function monitor() {

    let options = {
        url: `https://api.zocdoc.com/directory/v2/gql`,
        headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36',
            'x-zdata': 'eyJob3N0Ijoid3d3LnpvY2RvYy5jb20ifQ=='
        },
        json: {
            "operationName": "providerLocationsAvailability",
            "variables": { "insurancePlanId": "", "isNewPatient": true, "isReschedule": false, "numDays": days, "procedureId": "5243", "startDate": "2021-03-09", "widget": false, "providerLocationIds": locations },
            "query": "query providerLocationsAvailability($directoryId: String, $insurancePlanId: String, $isNewPatient: Boolean, $isReschedule: Boolean, $jumpAhead: Boolean, $numDays: Int, $procedureId: String, $providerLocationIds: [String], $searchRequestId: String, $startDate: String, $timeFilter: TimeFilter, $widget: Boolean) {\n  providerLocations(ids: $providerLocationIds) {\n    id\n    ...availability\n    __typename\n  }\n}\n\nfragment availability on ProviderLocation {\n  id\n  provider {\n    id\n    monolithId\n    __typename\n  }\n  location {\n    id\n    monolithId\n    state\n    phone\n    __typename\n  }\n  availability(directoryId: $directoryId, insurancePlanId: $insurancePlanId, isNewPatient: $isNewPatient, isReschedule: $isReschedule, jumpAhead: $jumpAhead, numDays: $numDays, procedureId: $procedureId, searchRequestId: $searchRequestId, startDate: $startDate, timeFilter: $timeFilter, widget: $widget) {\n    times {\n      date\n      timeslots {\n        isResource\n        startTime\n        __typename\n      }\n      __typename\n    }\n    firstAvailability {\n      startTime\n      __typename\n    }\n    showGovernmentInsuranceNotice\n    timesgridId\n    today\n    __typename\n  }\n  __typename\n}\n"
        },
        // proxy:
    }

    request.post(options, (err, res) => {
        if (res == undefined) {
            console.log(chalk.red(`Monitor timed out`))

            // Optional retry

            // setTimeout(function () {
            //     monitor()
            // }, 2500)
        }
        else {
            if (res.statusCode === 200) {
                console.log(chalk.yellow(`Times retrieved`))
                for (let t of res.body.data.providerLocations) {
                    for (let z of t.availability.times) {
                        if (z.timeslots.length !== 0) {
                            console.log(chalk.yellow(`Vaccine available at ${t.id} during ${z.timeslots[0].startTime} - Link to book https://www.zocdoc.com/booking/start?startTime=&locationId=${t.location.monolithId}&professionalId=${t.provider.monolithId}&directoryId=-1&repeatPatient=false&procedureId=5243&widget=`))
                            
                            // Optional Discord alerts
                            
                            // test.send(`Vaccine available at ${t.id} during ${z.timeslots[0].startTime} - Link to book https://www.zocdoc.com/booking/start?startTime=&locationId=${t.location.monolithId}&professionalId=${t.provider.monolithId}&directoryId=-1&repeatPatient=false&procedureId=5243&widget=`)
                        }
                    }
                }
            }
            else {
                console.log(chalk.red(`Failed to monitor... ${res.statusCode}`))
            }
        }
    })
}
