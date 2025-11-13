---
mode: 'agent'
model: Claude Sonnet 4
tools: ['githubRepo', 'search/codebase']
description: 'Create a Fortify Static Code Analyzer Custom rule'
---
Your goal is to create a new Fortify Static Code Analyzer custom ${input:analyzer:Structural} rule for ${input:language:abap} source code file: ${input:sourceFile}.

Ask for the source file `sourceFile` input if not provided.
Try and determine which Analyzer (Structural, Dataflow, Control Flow, Content and COnfiguration) would be best for the rule. If not determined default to Structural.
If not specified The language can be determined from the majority of source code files in the project.

## Security Rule Patterns

Common vulnerability patterns to detect in:
- **Missing Authorization**: Destructive operations without authority check
- **Sensitive Data Exposure**: Variables with names like `password`, `token`, `secret` being logged
- **SQL Injection**: Dynamic SQL construction without proper sanitization

## Rule Structure Guidelines

Use `StructuralRule` with these constructs:
- `FunctionCall fc: fc.function.name matches "pattern"`
- `Variable v: v.name matches ".*(?i)(sensitive_pattern).*"`
- `StringLiteral sl: sl.constantValue matches "value"`
- `exists`/`not exists` for combining conditions

Format version should be `25.4` for current Fortify version.

Requirements for the rule:
* It should be added to the existing [custom_rules.xml](../../etc/custom_rules.xml) but only after it has been tested and accepted by the user
* Check the file [example_rules.xml](../../etc/example_rules.xml) for examples of how to create the rules
* Do not make the rule too specific
* Use the hints in the comments in the source file to create the rules
* Try to create a rule which includes its context, e.g. a function being called to write/output/save a value
* Do not create rules that encompass class defined functions, only standard library functions

To create the rule carry out the following:

* create a `test_isolated` directory if it doesn't already exist, clean it up if it does
* copy ${sourceFile} $ to this directory
* create a `custom_rules.xml` file with just the single rule in
* If creating a StructuralRule, run the [DumpLine.ps1](bin\DumpLine.ps1) script passing the specific line where you think the vulnerability is:

```bash
DumpLine.ps1 -LineNumber 10 -FilesToScan "${sourceFile}" -WorkDir "test_isolated"
```

* This will produce a file called `tree.tree` which contains structural information that can be used when creating the Predicate
* Run the following commands to test the rule:

```bash
cd test_isolated

# Clean previous build data
sourceanalyzer "-Dcom.fortify.sca.ProjectRoot=.fortify" -b test_isolated -clean

# Translate source files
sourceanalyzer "-Dcom.fortify.sca.ProjectRoot=.fortify" -b test_isolated -verbose -debug ${sourceFile}

# Scan with custom rule
sourceanalyzer "-Dcom.fortify.sca.ProjectRoot=.fortify" -b test_isolated -rules custom_rule.xml -scan -verbose -debug
```

The output of the `-scan` command should be the expected vulnerability.
If it is not, ask the user for more details on how they want to proceed.



