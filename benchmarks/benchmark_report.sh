#!/usr/bin/env bash

urls=(report)

for url in "${urls[@]}"
do
  echo ${url}
  for n in {0..99}
  do
    start=$(date +%s%N)
    curl -s 'http://localhost/report' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Accept-Language: de,en-US;q=0.7,en;q=0.3' --compressed -H 'Content-Type: application/x-www-form-urlencoded' -H 'Origin: http://localhost' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Referer: http://localhost/report' -H 'Cookie: io=UKi8kuiaoK7lCaCCAAAE; sid=Fe26.2**c9a237bdeb14c71c9a18c23df64341fc1d2de8998e34e3880890dd371f38dff0*XLNOR5dEwZAC-j8yWKwudw*GakxcSJxSUKrnlHSXKE2pfefggoCPhTgLc0Ey39awj_RGJAfZs0kZ49eQ8ZD3_uM2dbMzrO2J0NUY-eBaqlxsnsXncrvg8axmdco3b5VWcuDQucmRhgCnzMdNnW4j7gI**bd4997ceb8c4640ac6386d43b560f57f0ca41e5c74522c57329ea32a91df1259*BXUaPkAQjd0I9gDEpKx8VaH5aSqMYYztMtlbRwDv6x0' -H 'Upgrade-Insecure-Requests: 1' --data-raw "incidentTitle=benchmark+report+test+${n}&incidentDesc=benchmark+report+test+${n}&incidentIndustry=Finanz-+und+Versicherungswesen&incidentData=benchmark+report+test+dealerhelena2+${n}&isreport=on&forsale=on&incidentPrice=12" > /dev/null
    echo $((($(date +%s%N) - $start)/1000000))
  done
done