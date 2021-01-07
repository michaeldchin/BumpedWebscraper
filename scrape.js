

const { SSL_OP_EPHEMERAL_RSA } = require('constants');
const fs = require('fs-plus')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
require('isomorphic-fetch')


const fetchLink = async (link) => {
    console.log(link)
    const response = await fetch(link)
    const text = await response.text()
    const dom = await new JSDOM(text)
    // TODO: pane 0-1 is not always patch notes, we gotta by textContent
    
    let patchNotesContent 
    let i = 0
    let foundMaintencePane = false
    do {
        const paneId = "pane-0-" + i
        patchNotesContent = dom.window.document.getElementById(paneId)
        if (patchNotesContent && patchNotesContent.innerHTML.includes('Patch Notes')) {
            patchNotesContent = patchNotesContent.innerHTML
            foundMaintencePane = true
        }
        i++;

    } while (patchNotesContent && !foundMaintencePane)
    
    return {
        link,
        patchNotesContent
    }
}

const getAllContent = async (links) => {
    const contentPromise = links.map(async link => {
        await new Promise(r => setTimeout(r, 500));
        return await fetchLink(link)
    })
    
    let contentArray = []
    for await (let content of contentPromise) {
        contentArray.push(content)
    }
    return contentArray
}

const contentToHtml = (contentArray) => {
    const bootstrap = '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">'
    const css = '<link rel="stylesheet" href="styles.css">'
    let finalHtml = bootstrap + '\n' + css + '\n'

    let tableOfContents = '<div id="toc_container"><ul class="toc_list">\n<p class="toc_title">Contents</p>\n'
/*
<ul class="toc_list">
  <li><a href="#Second_Point_Header">2 Second Point Header</a></li>
  <li><a href="#Third_Point_Header">3 Third Point Header</a></li>
</ul>
*/
    let container = '<div">'
    contentArray.forEach((content, i) => {
        const patchId = `patch${i}`
        const sectionName = content.link.split('/').slice(-2)[0].split('-').slice(-3).join('-')
        tableOfContents += `<li><a href="#${patchId}">${sectionName}</a></li>\n`
        container += `<div class="style${i % 2}" id="${patchId}">` +
            `</hr>${content.link}\n${content.patchNotesContent}` + 
            '</div>'
    })
    tableOfContents += '\n</ul></div>'
    container += '</div>'
    finalHtml += tableOfContents + '\n'
    finalHtml += container + '\n'


    return finalHtml
}

const main = async () => {
    try {
        const links = fs.readFileSync('links.txt', 'utf8').split('\r\n')
        //  console.log(links)
        const content = await getAllContent(links)
        const htmlContent = contentToHtml(content)
        fs.writeFileSync('output/output.html', htmlContent)
        console.log('done')
    }
    catch (e) {
        console.error(e)
        throw e
    }
}

main()