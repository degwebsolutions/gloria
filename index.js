const Storage = require('nedb')
const puppeteer = require('puppeteer')

// create storage
const database = new Storage({ filename: 'streets.db', autoload: true })

// constants
const URL = 'http://www.timisoreni.ro/info/strazi/with--timisoara/'

/**
 * @description start scraper
 */
const startScraper = async () => {

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  return getStreets(URL, browser, page)

}

/**
 * @description get streets
 */
const getStreets = async (url=URL, browser, page) => {

  console.log(`\n🚜 Gloria started collecting data at - ${url}, ${Date.now()}\n`)

  await page.goto(url)
  await page.waitForSelector('.items')
  
  // get streets
  const streets = await page.evaluate(() => {

    const streetsData = Array.from(document.querySelectorAll('.items .itemc'))
    const parsedStreets = streetsData.map(street => {

      const name = street.querySelector('h3 a').innerText
      const description = street.querySelector('.text').innerText
      const neighborhood = description.split(':').pop().trim()

      return {
        name,
        neighborhood,
      }
    })

    return parsedStreets

  })

  // is last page
  const nextUrl = await page.evaluate(() => {

    const nextElement = document.querySelector('.pagination .active').nextElementSibling
    const nextLink = nextElement.querySelector('a').href

    return nextLink

  })

  // save streets
  await database.insert(streets)

  // if is last page kill browser
  if (nextUrl === url) return browser.close()

  // get next page
  return getStreets(nextUrl, browser, page)

}

startScraper()
