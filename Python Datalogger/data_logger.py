import serial
import time
import schedule
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime


def main_func():
    arduino_data = arduino.readline()
    #print(arduino_data)
    try:
        decoded_values = str(arduino_data[0:len(arduino_data)].decode("utf-8"))
    except:
        pass
    #print(decoded_values)
    list_values = decoded_values.split('x')
    
    for i in list_values:
        i.strip('\r\n')

    for item in list_values:
        try:
            list_in_floats.append(float(item))
        except:
            pass

    print(f'Collected readings from Arduino: {list_in_floats}')

    # CALL FUNCTIONS FOR OTHER PROCESSING
    #
    
    # Push data to cloud
    # date_time_array = []
    date_time_array = get_the_date_and_time()
    push_data_to_cloud(list_in_floats, date_time_array)

    global counter
    counter += 1

    arduino_data = 0
    list_in_floats.clear()
    list_values.clear()
    print('<----------------------------->')

# Function to push data to Google Sheets
def push_data_to_cloud(push_data, date_time_list):
    scope = ["https://spreadsheets.google.com/feeds", 'https://www.googleapis.com/auth/spreadsheets',
             "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]

    creds_sample = ServiceAccountCredentials.from_json_keyfile_name("creds.json", scope)
    client = gspread.authorize(creds_sample)
    sheet = client.open("Senior Project Device Data Log").sheet1

    # existing_data = sheet.get_all_records()
    try:
        data_to_append = [date_time_list[0], date_time_list[1], push_data[0], push_data[1], push_data[2], push_data[3], push_data[4], push_data[5], push_data[6],
         push_data[7], push_data[8], push_data[9], push_data[10]]
        sheet.append_row(data_to_append)
    except (IndexError, gspread.exceptions.APIError):
        data_to_append = 'null'
        pass
    print('Readings pushed to cloud')


# Function to obtain current date and time
def get_the_date_and_time():
    # datetime object containing current date and time
    now = datetime.now()
    # dd/mm/YY H:M:S
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S")
    print("date and time =", dt_string)
    dt_array = dt_string.split(' ')
    return dt_array


# ----------------------------------------Main Code------------------------------------
# Declare variables to be used
list_values = []
list_in_floats = []
counter = 0

print('Program started')
arduino = serial.Serial('com8', 9600)
print('Established serial connection to Arduino')
print('Calibrating Sensors')
time.sleep(30)
# Counter - collect 62 data points and then break
schedule.every(10).seconds.do(main_func)

while True:
    schedule.run_pending()

#    if counter >= 60:
#       break

    time.sleep(1)

print('Data collected Successfully')
arduino.close()
print('Connection closed')