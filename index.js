const { PDFDocument, StandardFonts} = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const namePoint = new Point(153, 720);
const birthPoint = new Point(294, 720);
const milStartPoint = new Point(440, 720);
const phonePoint = new Point(282, 643);
const durationPoint = new Point(455, 643);
const workPlacePoint = new Point(200, 603);
const workStartDatePoint = new Point(101, 534);
const workStartTimePoint = new Point(201, 542);
const workEndTimePoint = new Point(201, 515);
const workMemoPoint = new Point(316, 539);
const writerPoint = new Point(327, 120);
const signMonthPoint = new Point(455, 155);
const signDatePoint = new Point(489, 155);

class UserInfo {
  constructor(name, birth, milStartDate, phoneNumber, workPlace) {
    this.name = name;
    this.birth = birth;
    this.milStartDate = milStartDate;
    this.phoneNumber = phoneNumber;
    this.workPlace = workPlace;
  }
}

class WorkInfo {
  constructor(date, workMemo, workStartTime = "10:00", workEndTime="19:00") {
    this.date = date;
    this.workMemo = workMemo;
    this.workStartTime = workStartTime;
    this.workEndTime = workEndTime;
  }
}

class WorkInfos {
  constructor(startDate, endDate, workInfoList) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.workInfoList = workInfoList;
  }
}

const file = fs.readFileSync("assets/work.pdf")
const fontFile = fs.readFileSync("assets/NanumBarunGothic.otf")

async function drawUserInfo(page, userInfo) {
  const fontSize = 10
  page.drawText(userInfo.name, {
    x: namePoint.x,
    y: namePoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.name, {
    x: writerPoint.x,
    y: writerPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.birth, {
    x: birthPoint.x,
    y: birthPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.milStartDate, {
    x: milStartPoint.x,
    y: milStartPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.phoneNumber, {
    x: phonePoint.x,
    y: phonePoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.workPlace, {
    x: workPlacePoint.x,
    y: workPlacePoint.y - fontSize,
    size: fontSize,
  })
  return page;
}

async function createSheet(fileName, userInfo, workInfos) {
  const pdfDoc = await PDFDocument.load(file)

  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontFile)
  console.log(font.getCharacterSet())

  var page = pdfDoc.getPage(0)
  page.setFont(font);

  page = await drawUserInfo(page, userInfo);

  const workInfoLen = workInfos.workInfoList.length
  const workDuration = workInfos.workInfoList[0].date + "~" + workInfos.workInfoList[workInfoLen-1].date

  var fontSize = 8
  page.drawText(workDuration, {
    x: durationPoint.x,
    y: durationPoint.y - fontSize,
    size: fontSize,
  })

  const splited = workInfos.workInfoList[workInfoLen-1].date.split('/')
  page.drawText(splited[0], {
    x: signMonthPoint.x,
    y: signMonthPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(splited[1], {
    x: signDatePoint.x,
    y: signDatePoint.y - fontSize,
    size: fontSize,
  })

  for (var i = 0; i < workInfos.workInfoList.length; i++) {
    fontSize = 8
    const height = 63
    var workInfo = workInfos.workInfoList[i]
    console.log(workInfo)
    page.drawText(workInfo.date, {
      x: workStartDatePoint.x,
      y: workStartDatePoint.y - fontSize - height*i,
      size: fontSize,
    })
    page.drawText(workInfo.workMemo, {
      x: workMemoPoint.x,
      y: workMemoPoint.y - fontSize - height*i,
      size: fontSize,
    })

    fontSize = 6
    page.drawText(workInfo.workStartTime, {
      x: workStartTimePoint.x,
      y: workStartTimePoint.y - fontSize - height*i,
      size: fontSize,
    })
    page.drawText(workInfo.workEndTime, {
      x: workEndTimePoint.x,
      y: workEndTimePoint.y - fontSize - height*i,
      size: fontSize,
    })
  }
  fs.writeFileSync(fileName, await pdfDoc.save());
}

async function parseCSV(csvFileName) {
  const file = fs.readFileSync(csvFileName)
  records = parse(file.toString(), {columns: false, skip_empty_lines:false})
  const userInfo = new UserInfo(
    name=records[0][1],
    birth=records[1][1],
    milStartDate=records[2][1],
    phoneNumber=records[3][1],
    workPlace=records[4][1]
  )
  var i = 0;
  var workInfos = [];
  for(i = 5; i < records.length; i+=5) {
    const workWindow = records.slice(i, i+5)
    var works = []
    for(var workIdx = 0; workIdx < workWindow.length; workIdx++) {
      var work = workWindow[workIdx]
      works.push(new WorkInfo(work[0], work[1]))
    }
    workInfos.push(
      new WorkInfos(
        startDate=workWindow[0][0],
        endDate=workWindow[workWindow.length-1][0],
        workInfoList=works
    ));
  }
  return [userInfo, workInfos]
}

async function main(){
  var myArgs = process.argv.slice(2);
  const csvFileName = myArgs[0]
  const [userInfo, workInfos] = await parseCSV(csvFileName);

  for (var i = 0; i < workInfos.length; i++) {
    var work = workInfos[i];
    console.log(i, work)
    await createSheet("./test" + i + ".pdf", userInfo, work)
  }
}

main().then(()=>{console.log("success")})
