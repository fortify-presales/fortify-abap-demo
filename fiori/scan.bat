@echo off
sourceanalyzer -b FioriAppBuild -clean
sourceanalyzer -b FioriAppBuild -exclude "**/test/**/*" -verbose -debug .
sourceanalyzer -b FioriAppBuild -scan -verbose -debug