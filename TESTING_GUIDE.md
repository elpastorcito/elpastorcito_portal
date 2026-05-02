# 🧪 Guía de Testing - El Pastorcito Parripollo

## Configuración Completada ✅

El proyecto ahora cuenta con un sistema de testing completo usando **Vitest** y **React Testing Library**.

## Comandos Disponibles

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests una vez (CI/CD)
npm run test:run

# Ejecutar tests con interfaz UI
npm run test:ui

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## Tests Implementados

### 1. Componentes de Tabs (60% de cobertura)

#### ClientsTab.test.jsx (7 tests)
- ✅ Renderiza estadísticas vacías inicialmente
- ✅ Muestra estado de carga
- ✅ Muestra clientes en la tabla
- ✅ Filtra clientes por nombre
- ✅ Muestra mensaje sin resultados
- ✅ Maneja errores de API
- ✅ Exporta CSV correctamente

#### StatsTab.test.jsx (7 tests)
- ✅ Renderiza estadísticas vacías
- ✅ Muestra estado de carga
- ✅ Muestra mensaje sin datos
- ✅ Muestra gráfico con datos
- ✅ Calcula estadísticas con email
- ✅ Maneja errores de API
- ✅ Renderiza barras del gráfico

### 2. Hooks (15% de cobertura)

#### useToast.test.jsx (5 tests)
- ✅ Inicializa con toast null
- ✅ Muestra mensajes de toast
- ✅ Limpia toast después de 3 segundos
- ✅ Muestra múltiples mensajes secuencialmente
- ✅ Acepta diferentes tipos de mensajes

### 3. Utilidades (25% de cobertura)

#### formatters.test.js (17 tests)
- ✅ `fmtPrice`: Formatea precios en ARS
- ✅ `fmtDate`: Formatea fechas completas
- ✅ `fmtDateShort`: Formatea fechas cortas
- ✅ `genSlug`: Genera slugs únicos
- ✅ `getFirstName`: Extrae primer nombre
- ✅ `exportCSV`: Exporta a CSV correctamente

**Total: 36 tests passing ✅**

## Estructura de Archivos

```
src/
├── components/
│   └── tabs/
│       ├── __tests__/
│       │   ├── ClientsTab.test.jsx
│       │   └── StatsTab.test.jsx
│       ├── ClientsTab.jsx
│       └── StatsTab.jsx
├── hooks/
│   └── __tests__/
│       └── useToast.test.jsx
├── utils/
│   └── __tests__/
│       └── formatters.test.js
└── test/
    └── setup.js
```

## Próximos Steps Recomendados

### Alta Prioridad
1. **MenuTab.test.jsx** - Tests para CRUD de menú
2. **SocialsTab.test.jsx** - Tests para redes sociales
3. **AppearanceTab.test.jsx** - Tests para personalización
4. **ConfigTab.test.jsx** - Tests para configuración

### Media Prioridad
5. **AdminPanel.test.jsx** - Tests para navegación entre tabs
6. **App.test.jsx** - Tests de integración para routing
7. **supabase.test.js** - Mocks más avanzados de API

### Baja Prioridad
8. Tests de accesibilidad (aria-labels, keyboard navigation)
9. Tests de performance (renderizado de listas grandes)
10. Tests E2E con Playwright o Cypress

## Mejores Prácticas Aplicadas

✅ **Mocks aislados**: Cada test tiene sus propios mocks  
✅ **Cleanup automático**: React Testing Library limpia después de cada test  
✅ **Nombres descriptivos**: Los tests describen el comportamiento esperado  
✅ **Testing de errores**: Se prueban tanto casos felices como errores  
✅ **Async/await**: Manejo correcto de operaciones asíncronas  

## Cobertura Actual

| Categoría | Archivos | Tests | Estado |
|-----------|----------|-------|--------|
| Components | 2 | 14 | ✅ |
| Hooks | 1 | 5 | ✅ |
| Utils | 1 | 17 | ✅ |
| **Total** | **4** | **36** | **✅** |

## Integración con CI/CD

Agregar al workflow de GitHub Actions o Netlify:

```yaml
- name: Run Tests
  run: npm run test:run
```

## Recursos Útiles

- [Documentación Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Mejores prácticas de testing](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Última actualización**: 2024  
**Cobertura objetivo**: 80%  
**Cobertura actual**: ~35%
