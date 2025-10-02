#!/usr/bin/env python3
"""
Script de vérification pour vulsoft.org
Vérifie que toutes les pages principales fonctionnent correctement
"""

import requests
import json
import time
from urllib.parse import urljoin, urlparse
import os
from pathlib import Path

class VulsoftChecker:
    def __init__(self, base_url="https://vulsoft.org"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Vulsoft-Checker/1.0'
        })
        self.results = {
            'pages': [],
            'api_endpoints': [],
            'assets': [],
            'errors': []
        }

    def check_page(self, path, expected_status=200):
        """Vérifier une page HTML"""
        url = urljoin(self.base_url, path)
        try:
            response = self.session.get(url, timeout=10)
            result = {
                'url': url,
                'status': response.status_code,
                'expected': expected_status,
                'success': response.status_code == expected_status,
                'size': len(response.content),
                'content_type': response.headers.get('content-type', ''),
                'response_time': response.elapsed.total_seconds()
            }
            
            # Vérifications supplémentaires pour les pages HTML
            if 'text/html' in result['content_type']:
                content = response.text.lower()
                result['has_title'] = '<title>' in content
                result['has_meta_viewport'] = 'viewport' in content
                result['has_manifest'] = 'manifest.json' in content
                result['has_service_worker'] = 'sw.js' in content or 'service worker' in content
                
            self.results['pages'].append(result)
            return result
            
        except Exception as e:
            error = {
                'url': url,
                'error': str(e),
                'type': 'page_check'
            }
            self.results['errors'].append(error)
            return {'url': url, 'success': False, 'error': str(e)}

    def check_api_endpoint(self, path, method='GET', expected_status=200):
        """Vérifier un endpoint API"""
        url = urljoin(self.base_url, path)
        try:
            if method == 'GET':
                response = self.session.get(url, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json={}, timeout=10)
            else:
                response = self.session.request(method, url, timeout=10)
                
            result = {
                'url': url,
                'method': method,
                'status': response.status_code,
                'expected': expected_status,
                'success': response.status_code == expected_status,
                'response_time': response.elapsed.total_seconds(),
                'content_type': response.headers.get('content-type', '')
            }
            
            # Vérifier si c'est du JSON valide
            if 'application/json' in result['content_type']:
                try:
                    json.loads(response.text)
                    result['valid_json'] = True
                except:
                    result['valid_json'] = False
                    
            self.results['api_endpoints'].append(result)
            return result
            
        except Exception as e:
            error = {
                'url': url,
                'method': method,
                'error': str(e),
                'type': 'api_check'
            }
            self.results['errors'].append(error)
            return {'url': url, 'success': False, 'error': str(e)}

    def check_asset(self, path):
        """Vérifier un asset (CSS, JS, images)"""
        url = urljoin(self.base_url, path)
        try:
            response = self.session.head(url, timeout=10)  # HEAD pour économiser la bande passante
            result = {
                'url': url,
                'status': response.status_code,
                'success': response.status_code == 200,
                'content_type': response.headers.get('content-type', ''),
                'size': response.headers.get('content-length', 'unknown'),
                'cache_control': response.headers.get('cache-control', ''),
                'response_time': response.elapsed.total_seconds()
            }
            
            self.results['assets'].append(result)
            return result
            
        except Exception as e:
            error = {
                'url': url,
                'error': str(e),
                'type': 'asset_check'
            }
            self.results['errors'].append(error)
            return {'url': url, 'success': False, 'error': str(e)}

    def run_full_check(self):
        """Exécuter une vérification complète"""
        print("🔍 Vérification complète de vulsoft.org")
        print("=" * 50)
        
        # Pages principales
        print("\n📄 Vérification des pages...")
        pages_to_check = [
            '/',
            '/pages/contact.html',
            '/pages/about.html',
            '/pages/login.html',
            '/pages/signup.html',
            '/pages/dashboard.html',
            '/pages/admin.html',
            '/academie.html',
            '/demo.html',
            '/offline.html',
            '/manifest.json',
            '/sw.js'
        ]
        
        for page in pages_to_check:
            result = self.check_page(page)
            status = "✅" if result.get('success') else "❌"
            print(f"  {status} {page} - {result.get('status', 'ERROR')}")
            
        # Endpoints API
        print("\n🔗 Vérification des endpoints API...")
        api_endpoints = [
            ('/health', 'GET', 200),
            ('/api/admin/stats', 'GET', [200, 401, 403]),  # Peut nécessiter auth
            ('/api/contact/messages', 'GET', [200, 401, 403]),
            ('/api/projects/stats/overview', 'GET', [200, 401, 403]),
        ]
        
        for endpoint, method, expected in api_endpoints:
            result = self.check_api_endpoint(endpoint, method, expected)
            # Accepter plusieurs codes de statut
            if isinstance(expected, list):
                success = result.get('status') in expected
            else:
                success = result.get('success')
            status = "✅" if success else "❌"
            print(f"  {status} {method} {endpoint} - {result.get('status', 'ERROR')}")
            
        # Assets principaux
        print("\n🎨 Vérification des assets...")
        assets_to_check = [
            '/css/main.css',
            '/css/auth.css',
            '/css/academie.css',
            '/js/api.js',
            '/js/pwa.js',
            '/js/notifications.js',
            '/images/logo-Vulsoft-1.svg'
        ]
        
        for asset in assets_to_check:
            result = self.check_asset(asset)
            status = "✅" if result.get('success') else "❌"
            print(f"  {status} {asset} - {result.get('status', 'ERROR')}")

    def generate_report(self):
        """Générer un rapport détaillé"""
        total_checks = len(self.results['pages']) + len(self.results['api_endpoints']) + len(self.results['assets'])
        successful_checks = sum([
            len([p for p in self.results['pages'] if p.get('success')]),
            len([a for a in self.results['api_endpoints'] if a.get('success')]),
            len([a for a in self.results['assets'] if a.get('success')])
        ])
        
        print(f"\n📊 Rapport de vérification")
        print("=" * 30)
        print(f"Total des vérifications: {total_checks}")
        print(f"Succès: {successful_checks}")
        print(f"Échecs: {total_checks - successful_checks}")
        print(f"Erreurs: {len(self.results['errors'])}")
        print(f"Taux de réussite: {(successful_checks/total_checks*100):.1f}%")
        
        # Détails des erreurs
        if self.results['errors']:
            print(f"\n❌ Erreurs détectées:")
            for error in self.results['errors']:
                print(f"  - {error['url']}: {error['error']}")
                
        # Recommandations
        print(f"\n💡 Recommandations:")
        
        # Vérifier PWA
        pwa_features = 0
        for page in self.results['pages']:
            if page.get('has_manifest'):
                pwa_features += 1
            if page.get('has_service_worker'):
                pwa_features += 1
                
        if pwa_features > 0:
            print("  ✅ Fonctionnalités PWA détectées")
        else:
            print("  ⚠️  Aucune fonctionnalité PWA détectée")
            
        # Vérifier les temps de réponse
        slow_pages = [p for p in self.results['pages'] if p.get('response_time', 0) > 2]
        if slow_pages:
            print(f"  ⚠️  {len(slow_pages)} pages lentes (>2s)")
        else:
            print("  ✅ Temps de réponse corrects")

    def save_report(self, filename='vulsoft-check-report.json'):
        """Sauvegarder le rapport en JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Rapport sauvegardé: {filename}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Vérificateur pour vulsoft.org')
    parser.add_argument('--url', default='https://vulsoft.org', 
                       help='URL de base à vérifier (défaut: https://vulsoft.org)')
    parser.add_argument('--local', action='store_true',
                       help='Vérifier en local (http://localhost:8001)')
    parser.add_argument('--save-report', action='store_true',
                       help='Sauvegarder le rapport en JSON')
    
    args = parser.parse_args()
    
    if args.local:
        base_url = 'http://localhost:8001'
    else:
        base_url = args.url
        
    checker = VulsoftChecker(base_url)
    
    print(f"🌐 Vérification de: {base_url}")
    
    try:
        checker.run_full_check()
        checker.generate_report()
        
        if args.save_report:
            checker.save_report()
            
    except KeyboardInterrupt:
        print("\n⏹️  Vérification interrompue")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")

if __name__ == "__main__":
    main()