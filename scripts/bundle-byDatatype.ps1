param(
	# Tells the script to ignore any content-less sources
	[switch]$SkipEmpty,
	# Compresses the JSON output
	[switch]$Compress
)

if (Test-Path ./indexes/datatypes.json) {
	$datatypes = Get-Content ./indexes/datatypes.json -Encoding utf8NoBOM | ConvertFrom-Json
} else {
	throw 'Index of datatypes not found! Use `npm run index:datatypes` to generate the index, then rerun this script.'
}

function Group-DatatypeContent {
	param (
		# Datatype to bundle
		[Parameter(Mandatory)]
		[string]
		$Datatype,
		# Families to bundle
		[Parameter(Mandatory)]
		[string]
		$Family
	)
	process {
		$bundle = [System.Collections.Generic.List[pscustomobject]]::new()

		$dataPath = if ($Family -eq 'common') {
			"./data/common/$Datatype/*"
		} elseif ($Datatype -eq 'source') {
			"./data/$Family/*/*"
		} else {
			"./data/$Family/*/$Datatype/*"
		}

		Get-ChildItem $dataPath -File | ForEach-Object {
			$bundle.Add(($_ | Get-Content -Encoding utf8NoBOM | ConvertFrom-Json))
		}

		if ($SkipEmpty -and -not $bundle.Count) {
			$null
		} else {
			[pscustomobject]@{
				$Datatype = $bundle
			}
		}
	}
}

Write-Host "Deleting existing bundle...`n"
if (Test-Path ./bundles/byDatatype) {
	Get-ChildItem ./bundles/byDatatype -Recurse -File | Remove-Item
}

function Get-DatatypeContentGroup {
	param (
		[string]
		$Datatype,
		[string]
		$Family
	)
	$bundle = Group-DatatypeContent -Datatype $Datatype -Family $Family
	if ($bundle) {
		if (-not (Test-Path "./bundles/byDatatype/$Family")) {
			$null = mkdir "./bundles/byDatatype/$Family"
			Write-Host "`nCreated directory ./bundles/byDatatype/$Family"
		}
		$bundle
		| ConvertTo-Json -Depth 99 -Compress:$Compress
		| Out-File "./bundles/byDatatype/$Family/$Datatype.json" -Encoding utf8NoBOM
		Write-Host "Bundled $Family ""$Datatype"" data."
	} else {
		Write-Host "Skipped empty bundle of $Family ""$Datatype"" data"
	}
}

$datatypes | ForEach-Object {
	if ($_ -in @('license', 'sourceGroup')) {
		Get-DatatypeContentGroup -Datatype $_ -Family 'common'
	} else {
		foreach ($family in @('core', 'homebrew')) {
			Get-DatatypeContentGroup -Datatype $_ -Family $family
		}
	}
}

Write-Host "`nBundled everything into ./bundles/byDatatype"
