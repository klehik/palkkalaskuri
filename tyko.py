import PyPDF2
import sys
import os
import json
import re


def main(argv):
    # get pdf and salary info from arguments
    pdf = sys.argv[1]
    wage = sys.argv[2]
    tax = sys.argv[3]

    # extract text from pdf
    file = extractData(pdf)

    # get relevant info from text
    extras = []
    valid = True
    generateData(file, extras, valid)

    data = {
        "extras": extras,
        "other": {"wage": wage, "tax": tax, "wasValidFile": valid},
    }
    # calculate
    # calculate(data)

    # convert to json, utf-8
    data = json.dumps(data, ensure_ascii=False).encode("utf8")

    # output data
    print(data.decode())
    # remove pdf from
    os.remove(pdf)


def extractData(pdf):
    # creating a pdf file object
    pdfFileObj = open(pdf, "rb")

    # creating a pdf reader object
    pdfReader = PyPDF2.PdfFileReader(pdfFileObj)

    # creating a page object
    pageObj = pdfReader.getPage(0)

    # extracting text from page
    file = pageObj.extractText()
    pdfFileObj.close()

    return file


def get_hours(arr):
    value = ""
    i = len(arr)
    flag = False
    chars = []
    for char in arr:
        if char != " ":
            chars.append(char)

    for char in chars:
        if char == ")":
            flag = True
            continue
        if char == ":":
            i = 2
        if flag:
            value += char
        if i == 0:
            flag = False
            break
        i -= 1
    return value


def generateData(file, data, valid):
    # remove line changes from file
    file = re.sub(r"[\n]*", "", file)

    if ("suunnitteluraja") not in file:
        valid = False
        return

    label = [
        "sunnuntaityö",
        "iltatyö",
        "yötyö",
        "lauantaityö",
        "50% ylityö",
        "100% ylityö",
        "hälytysraha",
    ]
    multipliers = [1, 0.15, 0.4, 0.2, 1.5, 2, 150]

    for label, multiplier in zip(label, multipliers):
        if label not in file:
            continue

        if label == "iltatyö" or label == "yötyö":
            split = file.split(label, maxsplit=1)[1]
            value = get_hours(split)

        elif label == "hälytysraha":
            value = file.split(label, maxsplit=1)[1].split()[1]
            item = {"label": label, "quantity": int(value), "multiplier": multiplier}
            data.append(item)
            continue
        else:
            value = file.split(label, maxsplit=1)[1].split()[0]

        temp = value.split(":")
        hours = int(temp[0])
        minutes = int(temp[1])

        totalHours = round(hours + (minutes / 60), 2)

        item = {"label": label, "quantity": totalHours, "multiplier": multiplier}

        data.append(item)


""" def calculate(data):
    
    brutto = 0

    for item in data:
        label = item["lisa"]
        hours = item["tunnit"]
        multiplier = item["kerroin"]

        itemBrutto = round(hours * 18.07 * multiplier,2)
        
        brutto += itemBrutto
        
    
    
    totBrutto = round(brutto,2)
    
    
    totNetto = round(totBrutto - round(totBrutto * 0.19, 2) - round(totBrutto * 0.014,2) - round(totBrutto * 0.0715, 2) - round(totBrutto * 0.011,2),2) """


if __name__ == "__main__":
    main(sys.argv)
