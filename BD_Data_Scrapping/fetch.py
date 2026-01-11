from bs4 import BeautifulSoup
import requests
import io

if __name__ == '__main__':
    startPage = 46
    endPage = 2768
    fileTxt = open("data.txt", "a")
    for x in range(startPage,endPage+1):
        URL = "http://case.doe.gov.bd/index.php?option=com_content&view=article&id="+str(x)
        HEADERS = ({'User-Agent':
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/404.0.2403.157 Safari/537.36',
                'Accept-Language': 'en-US, en;q=0.5'})
        source = requests.get(URL, headers=HEADERS)
        soup = BeautifulSoup(source.content, 'lxml')
        try:
            main_container = soup.find('div', class_='art-post-inner').text #main container of the information
            date_index = main_container.find("Date")
            date = main_container[date_index:date_index+16]
            fileTxt.write("%s" % date)
            for tr in soup.find_all('tr'):
                fileTxt.write("\n")
                each_row = ''
                for td in tr.find_all('td'):
                    each_row = each_row + td.text+','
                each_row = each_row[:-1]
                fileTxt.write("%s" % each_row)
        except AttributeError: 
            print('could not found at '+str(x))
        
        fileTxt.write("\n\n")
    fileTxt.close()

    