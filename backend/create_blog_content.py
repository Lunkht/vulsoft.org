#!/usr/bin/env python3
"""
Script pour créer du contenu par défaut pour le blog
Usage: python create_blog_content.py
"""

import requests
import json
from datetime import datetime, timedelta

def create_blog_posts():
    """Créer des articles de blog par défaut"""
    
    print("📝 Création du contenu par défaut pour le blog Vulsoft")
    print("=" * 60)
    
    # Articles par défaut
    default_posts = [
        {
            "title": "Bienvenue sur le blog Vulsoft",
            "content": """<h2>Bienvenue dans notre univers digital !</h2>
            
            <p>Nous sommes ravis de vous accueillir sur le blog officiel de Vulsoft, votre partenaire de confiance pour la transformation digitale en Afrique de l'Ouest.</p>
            
            <h3>Ce que vous trouverez ici</h3>
            <ul>
                <li><strong>Tutoriels techniques</strong> : Guides pratiques sur les dernières technologies</li>
                <li><strong>Études de cas</strong> : Retours d'expérience sur nos projets clients</li>
                <li><strong>Tendances tech</strong> : Analyse des innovations qui façonnent l'avenir</li>
                <li><strong>Conseils business</strong> : Stratégies pour réussir votre transformation digitale</li>
            </ul>
            
            <p>Notre équipe d'experts partage régulièrement ses connaissances pour vous aider à naviguer dans le monde complexe mais passionnant de la technologie.</p>
            
            <blockquote>
                <p>"L'innovation distingue un leader d'un suiveur." - Steve Jobs</p>
            </blockquote>
            
            <p>Restez connectés et n'hésitez pas à nous faire part de vos suggestions d'articles !</p>""",
            "is_published": True
        },
        {
            "title": "L'essor des Progressive Web Apps en Afrique",
            "content": """<h2>Les PWA : L'avenir du mobile en Afrique</h2>
            
            <p>L'Afrique connaît une croissance mobile exceptionnelle avec plus de 500 millions d'utilisateurs de smartphones. Dans ce contexte, les Progressive Web Apps (PWA) représentent une opportunité unique.</p>
            
            <h3>Pourquoi les PWA sont parfaites pour l'Afrique ?</h3>
            
            <h4>1. Connectivité limitée</h4>
            <p>Les PWA fonctionnent hors ligne et se synchronisent dès que la connexion est rétablie. Parfait pour les zones à connectivité intermittente.</p>
            
            <h4>2. Appareils moins puissants</h4>
            <p>Plus légères que les apps natives, les PWA consomment moins de ressources et fonctionnent sur des appareils d'entrée de gamme.</p>
            
            <h4>3. Installation simplifiée</h4>
            <p>Pas besoin de passer par les app stores. L'installation se fait directement depuis le navigateur.</p>
            
            <h3>Cas d'usage concrets</h3>
            <ul>
                <li><strong>E-commerce</strong> : Boutiques en ligne accessibles même hors ligne</li>
                <li><strong>Services bancaires</strong> : Consultation de comptes sans connexion permanente</li>
                <li><strong>Éducation</strong> : Cours et ressources disponibles offline</li>
                <li><strong>Agriculture</strong> : Applications météo et conseils agricoles</li>
            </ul>
            
            <p>Chez Vulsoft, nous développons des PWA sur mesure pour nos clients africains. Contactez-nous pour découvrir comment cette technologie peut transformer votre business !</p>""",
            "is_published": True
        },
        {
            "title": "Guide complet : Créer une API REST avec FastAPI",
            "content": """<h2>FastAPI : La révolution des APIs Python</h2>
            
            <p>FastAPI est devenu le framework de référence pour créer des APIs modernes en Python. Voici pourquoi nous l'utilisons chez Vulsoft et comment bien commencer.</p>
            
            <h3>Pourquoi FastAPI ?</h3>
            
            <h4>🚀 Performance exceptionnelle</h4>
            <p>FastAPI est l'un des frameworks Python les plus rapides, comparable à Node.js et Go.</p>
            
            <h4>📚 Documentation automatique</h4>
            <p>Génération automatique de documentation interactive avec Swagger UI.</p>
            
            <h4>🔒 Validation automatique</h4>
            <p>Validation des données d'entrée et de sortie avec Pydantic.</p>
            
            <h3>Exemple pratique</h3>
            
            <pre><code>from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    name: str
    email: str

@app.post("/users/")
async def create_user(user: User):
    return {"message": f"User {user.name} created!"}
</code></pre>
            
            <h3>Bonnes pratiques</h3>
            <ol>
                <li><strong>Structure modulaire</strong> : Organisez vos routes dans des modules séparés</li>
                <li><strong>Gestion d'erreurs</strong> : Utilisez HTTPException pour les erreurs</li>
                <li><strong>Authentification</strong> : Implémentez JWT pour sécuriser vos endpoints</li>
                <li><strong>Tests</strong> : Utilisez pytest pour tester vos APIs</li>
                <li><strong>Documentation</strong> : Documentez vos modèles Pydantic</li>
            </ol>
            
            <p>Vous voulez approfondir ? Consultez notre formation FastAPI sur Vulsoft Academy !</p>""",
            "is_published": True
        },
        {
            "title": "Sécurité web : Les essentiels pour 2024",
            "content": """<h2>Sécurité web : Protégez vos applications</h2>
            
            <p>La sécurité web n'a jamais été aussi cruciale. Avec l'augmentation des cyberattaques, voici les mesures essentielles à implémenter.</p>
            
            <h3>Top 10 des vulnérabilités OWASP 2024</h3>
            
            <h4>1. Injection SQL</h4>
            <p>Toujours d'actualité ! Utilisez des requêtes préparées et validez toutes les entrées utilisateur.</p>
            
            <h4>2. Authentification défaillante</h4>
            <p>Implémentez l'authentification à deux facteurs (2FA) et des politiques de mots de passe robustes.</p>
            
            <h4>3. Exposition de données sensibles</h4>
            <p>Chiffrez toutes les données sensibles en transit et au repos.</p>
            
            <h3>Mesures de protection</h3>
            
            <h4>🔐 HTTPS partout</h4>
            <p>Utilisez HTTPS pour toutes vos communications. Let's Encrypt offre des certificats gratuits.</p>
            
            <h4>🛡️ Headers de sécurité</h4>
            <ul>
                <li>Content-Security-Policy</li>
                <li>X-Frame-Options</li>
                <li>X-Content-Type-Options</li>
                <li>Strict-Transport-Security</li>
            </ul>
            
            <h4>🔍 Audit régulier</h4>
            <p>Effectuez des audits de sécurité réguliers et des tests de pénétration.</p>
            
            <h3>Outils recommandés</h3>
            <ul>
                <li><strong>OWASP ZAP</strong> : Scanner de vulnérabilités gratuit</li>
                <li><strong>Burp Suite</strong> : Outil professionnel de test de sécurité</li>
                <li><strong>Snyk</strong> : Analyse des dépendances</li>
                <li><strong>SonarQube</strong> : Analyse de code statique</li>
            </ul>
            
            <p>La sécurité est un processus continu, pas une destination. Chez Vulsoft, nous intégrons la sécurité dès la conception de vos projets.</p>""",
            "is_published": True
        },
        {
            "title": "Intelligence Artificielle : Opportunités pour les entreprises africaines",
            "content": """<h2>L'IA au service de l'Afrique</h2>
            
            <p>L'Intelligence Artificielle n'est plus de la science-fiction. Elle transforme déjà de nombreux secteurs en Afrique. Découvrez comment votre entreprise peut en bénéficier.</p>
            
            <h3>Secteurs en transformation</h3>
            
            <h4>🏥 Santé</h4>
            <ul>
                <li>Diagnostic médical assisté par IA</li>
                <li>Télémédecine intelligente</li>
                <li>Gestion optimisée des stocks de médicaments</li>
            </ul>
            
            <h4>🌾 Agriculture</h4>
            <ul>
                <li>Prédiction des rendements</li>
                <li>Détection précoce des maladies des cultures</li>
                <li>Optimisation de l'irrigation</li>
            </ul>
            
            <h4>🏦 Services financiers</h4>
            <ul>
                <li>Évaluation du risque crédit</li>
                <li>Détection de fraude</li>
                <li>Chatbots pour le service client</li>
            </ul>
            
            <h3>Technologies accessibles</h3>
            
            <h4>Chatbots intelligents</h4>
            <p>Automatisez votre service client avec des chatbots capables de comprendre le contexte et les langues locales.</p>
            
            <h4>Analyse prédictive</h4>
            <p>Anticipez les tendances de votre marché grâce à l'analyse de vos données historiques.</p>
            
            <h4>Vision par ordinateur</h4>
            <p>Automatisez le contrôle qualité, la surveillance de sécurité, ou l'analyse d'images médicales.</p>
            
            <h3>Comment commencer ?</h3>
            <ol>
                <li><strong>Identifiez vos cas d'usage</strong> : Quels processus peuvent être automatisés ?</li>
                <li><strong>Auditez vos données</strong> : L'IA a besoin de données de qualité</li>
                <li><strong>Commencez petit</strong> : Pilotez sur un cas d'usage spécifique</li>
                <li><strong>Formez vos équipes</strong> : L'adoption est clé du succès</li>
                <li><strong>Mesurez l'impact</strong> : Définissez des KPIs clairs</li>
            </ol>
            
            <p>Chez Vulsoft, nous accompagnons les entreprises africaines dans leur transformation IA. De la stratégie à l'implémentation, nous sommes votre partenaire technologique.</p>
            
            <blockquote>
                <p>"L'IA ne remplacera pas les humains, mais les humains qui utilisent l'IA remplaceront ceux qui ne l'utilisent pas."</p>
            </blockquote>""",
            "is_published": True
        }
    ]
    
    api_base = "http://localhost:8002/api/blog"
    
    for i, post in enumerate(default_posts):
        try:
            print(f"📝 Création de l'article {i+1}: {post['title']}")
            
            response = requests.post(
                f"{api_base}/posts",
                headers={"Content-Type": "application/json"},
                data=json.dumps(post)
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Article créé avec l'ID: {result['id']}")
            else:
                error_data = response.json() if response.headers.get('content-type') == 'application/json' else response.text
                print(f"   ❌ Erreur: {error_data}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Impossible de se connecter au serveur API")
            print("      Assurez-vous que le serveur est démarré avec: python start.py")
            break
        except Exception as e:
            print(f"   ❌ Erreur: {e}")
    
    print("\n🎉 Création du contenu terminée !")
    print("🌐 Visitez http://localhost:8001/pages/blog.html pour voir le blog")

if __name__ == "__main__":
    create_blog_posts()