#!/bin/sh
sourceanalyzer -b abap-demo -clean
sourceanalyzer -b abap-demo -verbose -debug .
sourceanalyzer -b abap-demo -scan -verbose -debug