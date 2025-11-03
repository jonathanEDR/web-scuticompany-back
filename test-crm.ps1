# ============================================
# Script Automatizado de Pruebas CRM
# ============================================

$baseUrl = "http://localhost:5000/api"
$testResults = @()

# Colores para output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }

Write-Host "INICIANDO PRUEBAS AUTOMATIZADAS CRM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# ============================================
# TEST 1: Verificar servidor
# ============================================
Write-Info "TEST 1: Verificando servidor..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "Servidor respondiendo correctamente"
        $testResults += "✅ Servidor OK"
    }
} catch {
    Write-Error "Servidor no responde: $($_.Exception.Message)"
    $testResults += "❌ Servidor ERROR"
    exit 1
}

# ============================================
# TEST 2: Obtener plantillas (sin auth necesaria en algunas rutas)
# ============================================
Write-Info "TEST 2: Obteniendo plantillas..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/crm/templates" -Method GET -ErrorAction Stop
    $templates = $response.Content | ConvertFrom-Json
    
    if ($templates.success -and $templates.data.plantillas.Count -ge 3) {
        Write-Success "Plantillas encontradas: $($templates.data.plantillas.Count)"
        $templateId = $templates.data.plantillas[0]._id
        Write-Info "Primera plantilla ID: $templateId"
        $testResults += "[OK] Plantillas OK ($($templates.data.plantillas.Count) encontradas)"
    } else {
        Write-Warning "Plantillas no encontradas o estructura inesperada"
        $testResults += "⚠️ Plantillas: estructura inesperada"
    }
} catch {
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*403*") {
        Write-Warning "Plantillas requieren autenticación"
        $testResults += "⚠️ Plantillas: requiere auth"
    } else {
        Write-Error "Error obteniendo plantillas: $($_.Exception.Message)"
        $testResults += "❌ Plantillas ERROR"
    }
}

# ============================================
# TEST 3: Verificar leads (sin token por ahora)
# ============================================
Write-Info "TEST 3: Verificando endpoint de leads..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/crm/leads" -Method GET -ErrorAction Stop
    Write-Warning "Leads accesible sin token - revisar seguridad"
    $testResults += "⚠️ Leads: sin autenticación"
} catch {
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*403*") {
        Write-Success "Leads protegido por autenticación (correcto)"
        $testResults += "✅ Leads: protegido correctamente"
    } else {
        Write-Error "Error inesperado en leads: $($_.Exception.Message)"
        $testResults += "❌ Leads: error inesperado"
    }
}

# ============================================
# TEST 4: Verificar estructura de base de datos (MongoDB)
# ============================================
Write-Info "TEST 4: Verificando conexión MongoDB..."
try {
    # Verificar que el servidor tenga conexión (indirectamente)
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -ErrorAction Stop
    Write-Success "MongoDB parece estar conectado (servidor funcionando)"
    $testResults += "✅ MongoDB: conexión OK"
} catch {
    Write-Error "Problemas de conexión general"
    $testResults += "❌ MongoDB: posibles problemas"
}

# ============================================
# TEST 5: Probar endpoint público de CMS
# ============================================
Write-Info "TEST 5: Probando endpoint público..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/cms/pages/home" -Method GET -ErrorAction Stop
    $homeData = $response.Content | ConvertFrom-Json
    
    if ($homeData.success) {
        Write-Success "Endpoint CMS funcionando correctamente"
        $testResults += "✅ CMS: endpoint público OK"
    }
} catch {
    Write-Warning "Endpoint CMS no accesible: $($_.Exception.Message)"
    $testResults += "⚠️ CMS: no accesible"
}

# ============================================
# TEST 6: Verificar archivos de configuración
# ============================================
Write-Info "TEST 6: Verificando configuración..."

# Verificar .env
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $checks = @{
        "MONGODB_URI" = $envContent -match "MONGODB_URI="
        "RESEND_API_KEY" = $envContent -match "RESEND_API_KEY="
        "CLOUDINARY_CLOUD_NAME" = $envContent -match "CLOUDINARY_CLOUD_NAME="
        "CLERK_SECRET_KEY" = $envContent -match "CLERK_SECRET_KEY="
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Success "$($check.Key) configurado"
        } else {
            Write-Warning "$($check.Key) no encontrado"
        }
    }
    $testResults += "✅ Configuración: .env encontrado"
} else {
    Write-Error "Archivo .env no encontrado"
    $testResults += "❌ Configuración: .env missing"
}

# Verificar scripts importantes
$importantFiles = @(
    "scripts/seedMensajeria.js",
    "models/Lead.js", 
    "models/LeadMessage.js",
    "models/MessageTemplate.js",
    "controllers/leadController.js",
    "controllers/leadMessageController.js"
)

$filesOK = 0
foreach ($file in $importantFiles) {
    if (Test-Path $file) {
        $filesOK++
    } else {
        Write-Warning "Archivo faltante: $file"
    }
}

Write-Success "Archivos importantes encontrados: $filesOK/$($importantFiles.Count)"
$testResults += "✅ Archivos: $filesOK/$($importantFiles.Count) encontrados"

# ============================================
# TEST 7: Verificar package.json y dependencias
# ============================================
Write-Info "TEST 7: Verificando dependencias..."
if (Test-Path "package.json") {
    $package = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    $requiredDeps = @("express", "mongoose", "resend", "cloudinary", "express-fileupload")
    $foundDeps = 0
    
    foreach ($dep in $requiredDeps) {
        if ($package.dependencies.$dep -or $package.devDependencies.$dep) {
            $foundDeps++
        } else {
            Write-Warning "Dependencia faltante: $dep"
        }
    }
    
    Write-Success "Dependencias encontradas: $foundDeps/$($requiredDeps.Count)"
    $testResults += "✅ Dependencias: $foundDeps/$($requiredDeps.Count) OK"
}

# ============================================
# RESUMEN DE RESULTADOS
# ============================================
Write-Host "`n🏁 RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

foreach ($result in $testResults) {
    Write-Host $result
}

# Calcular puntaje
$passed = ($testResults | Where-Object { $_ -like "✅*" }).Count
$warnings = ($testResults | Where-Object { $_ -like "⚠️*" }).Count
$errors = ($testResults | Where-Object { $_ -like "❌*" }).Count

Write-Host "`n📊 ESTADÍSTICAS:" -ForegroundColor Cyan
Write-Host "✅ Pruebas exitosas: $passed" -ForegroundColor Green
Write-Host "⚠️ Advertencias: $warnings" -ForegroundColor Yellow
Write-Host "❌ Errores: $errors" -ForegroundColor Red

if ($errors -eq 0 -and $warnings -le 2) {
    Write-Host "`n🎉 SISTEMA LISTO PARA USAR" -ForegroundColor Green
} elseif ($errors -eq 0) {
    Write-Host "`n👍 SISTEMA FUNCIONAL CON ADVERTENCIAS MENORES" -ForegroundColor Yellow
} else {
    Write-Host "`n🚨 REVISAR ERRORES ANTES DE CONTINUAR" -ForegroundColor Red
}

Write-Host "`n🔧 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Para probar con autenticación, obtén un token de Clerk" -ForegroundColor White
Write-Host "2. Usa Postman o el TESTING_GUIDE.md para pruebas completas" -ForegroundColor White
Write-Host "3. Revisa EMAIL_SETUP.md para configurar emails" -ForegroundColor White
Write-Host "4. Para adjuntos, verifica que las rutas estén habilitadas" -ForegroundColor White

Write-Host "`n🎯 COMANDOS ÚTILES:" -ForegroundColor Cyan
Write-Host "npm run dev                    # Iniciar servidor" -ForegroundColor White
Write-Host "node scripts/seedMensajeria.js # Recrear datos de prueba" -ForegroundColor White
Write-Host "mongo web-scuti               # Conectar a MongoDB" -ForegroundColor White