#!/usr/bin/env bash

urls=(marketplace orders report view verify dispute warnings warningreport)

for url in "${urls[@]}"
do
  echo ${url}
  for n in {1..100}
  do
    start=$(date +%s%N)
    curl -s "http://localhost/${url}" > /dev/null
    echo $((($(date +%s%N) - $start)/1000000))
  done
done