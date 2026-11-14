# Cyril Foucher

## En bref

En reconversion depuis mai 2026 après plusieurs années dans l'industrie : usinage sur commande numérique, puis assemblage de moteurs d'avion. Intéressé par le développement web et l'intégration de l'IA dans les applications.

- Titre : Développeur full stack junior
- Localisation : région toulousaine
- Début de la reconversion : mai 2026
- Recherche : premier poste de développeur full stack, sur site, en hybride ou à distance
- Disponibilité : un mois, probablement négociable
- Contact : macylcyril@hotmail.fr
- LinkedIn : https://www.linkedin.com/in/cyril-foucher-a06a19236/
- GitHub : https://github.com/cyrilfoucher

## Compétences

- Frontend : React, TypeScript, JavaScript, Tailwind CSS, HTML, CSS
- Backend : Node.js, Express, API REST, Prisma, Zod
- Bases de données : PostgreSQL, pgvector, MongoDB
- IA : API Mistral, embeddings, recherche sémantique, RAG, réponses structurées en JSON
- Outils : Git, GitHub, Docker, GitHub Actions, Vitest, Render

## Projets

### DevKnowledge (septembre à novembre 2026)

Base de connaissances pour développeurs, assistée par l'IA. En ligne, testable sans inscription.

- Site : https://knowledge-ai-zztb.onrender.com
- Code : https://github.com/cyrilfoucher/knowledge-ai
- Fonctionnalités : comptes et rôles, administration, fiches en Markdown, recherche, favoris, J'aime, profils publics
- IA : recherche par le sens avec pgvector, assistant RAG qui répond à partir des fiches et cite ses sources, résumés et suggestions de tags
- Points techniques : authentification par cookie HttpOnly, validation Zod, protection contre l'injection de prompt, limite d'appels à l'IA, Docker, tests, intégration continue
- Difficultés résolues :
  - Requêtes N+1 : l'affichage d'une liste de fiches déclenchait des requêtes supplémentaires pour chaque fiche, afin de savoir si l'utilisateur l'avait mise en favori ou aimée. Le nombre de requêtes augmentait avec la taille de la page. Il l'a corrigé en récupérant ces informations pour toutes les fiches en une seule fois.
  - Limite d'appels à l'IA en production : la limite par adresse IP fonctionnait en local, mais pas en ligne, car toutes les requêtes semblaient venir de la même adresse. En cause, les proxys placés devant le serveur par l'hébergeur. Il a identifié le nombre de proxys avec une route de diagnostic, puis réglé Express pour lire la vraie adresse du visiteur.
  - Pertinence de la recherche par le sens : les scores de similarité des fiches étaient très proches les uns des autres, si bien qu'un seuil fixe renvoyait soit tout, soit rien. Il a mis en place un seuil relatif, calculé à partir du meilleur résultat de chaque recherche.
  - Poids du site : il a réduit le chargement initial de 880 Ko à environ 308 Ko, en ne chargeant chaque page qu'au moment où le visiteur l'ouvre.

### Autour du Monde (juillet à septembre 2026)

Premier projet full stack : application de voyage avec boutique de guides. Ce projet lui a fait découvrir la structure d'une application complète, et comprendre concrètement comment le frontend, l'API et la base de données fonctionnent ensemble.

- Site : https://autour-du-monde.onrender.com
- Fonctionnalités : authentification JWT, panier, paiement Stripe, espace administrateur, upload d'images avec Cloudinary, emails transactionnels
- Ajouts ultérieurs : Docker, tests et intégration continue
- Difficulté résolue : après la mise en ligne sur l'offre gratuite de Render, les emails ne partaient plus, alors qu'ils fonctionnaient en local : l'envoi par SMTP était bloqué en production. Il a refactorisé tout le module d'envoi pour passer par l'API de Brevo, qui envoie les emails par de simples requêtes HTTP.

## Parcours professionnel

### Technicien assemblage moteurs, ARTS Solutions, en mission chez ATR (depuis juin 2023)

Assemblage des moteurs Pratt & Whitney PW127M et PW127XT.

- Travail selon des procédures et une documentation technique strictes, où chaque étape est tracée et vérifiée
- Contrôle qualité et respect des exigences de sécurité aéronautique
- Travail en équipe sur une chaîne d'assemblage, avec des délais à tenir

### Tourneur, programmeur et metteur au point sur tour-fraiseur à commande numérique (2017 à 2023, dont Themis de 2018 à 2023)

Tournage sur tours-fraiseurs à commande numérique 2, 3 et 4 axes : programmation ISO, Manual Guide, Haas, CAPS, Easymill, mise au point des programmes et gammes de fabrication.

## Formation

- Développement web en autodidacte depuis mai 2026, en plus de son travail : environ 30 heures par semaine au début, puis une vingtaine d'heures par semaine. De mai à juillet, apprentissage de HTML, CSS et JavaScript, puis un premier projet full stack en juillet et un second en septembre
- Niveau BTS MUC, Lycée du Castella (2015)
- Bac STG Mercatique, Lycée du Castella (2013)

## Langues et divers

- Anglais : score de 110 au test Duolingo
- Permis B
- Centres d'intérêt : voyages, musculation, basketball, sneakers, jeux vidéo, perroquets, voitures, histoire, en particulier la Seconde Guerre mondiale

## Points forts

- L'usinage lui a donné le goût de la programmation, ainsi que la rigueur et la minutie : sur une machine à commande numérique, une erreur de programme se paie en pièce ratée ou machine hors service avec de grosses réparations.
- L'aéronautique lui a appris à suivre des procédés stricts, où chaque étape est tracée et vérifiée.
- Il a appris le développement web seul, le soir, en plus de son travail : deux mois pour apprendre les bases, puis deux applications full stack mises en ligne en quatre mois.
- Il ne lâche pas : quand il bloque, il cherche, teste, et continue jusqu'à comprendre.

## Questions fréquentes

### Pourquoi cette reconversion ?

Cyril a découvert la programmation dans l'usinage, en écrivant les programmes des machines à commande numérique, et c'est la partie de son métier qu'il préférait. Il a choisi d'en faire son métier à part entière, dans le développement web, un domaine où il peut créer des applications complètes et continuer à apprendre.

### Pourquoi apprendre seul plutôt que suivre une formation ?

Cyril a choisi d'apprendre en autodidacte pour garder son poste pendant sa reconversion, plutôt que de quitter son emploi pour une formation. Il a donc appris le soir, en plus de son travail. Ce choix demande de l'organisation et de la régularité, et l'a habitué à chercher seul les solutions quand il bloque.

### Comment utilise-t-il l'IA pour coder ?

Pour ses deux premiers projets, il a écrit tout le code lui-même, avec une IA comme formateur : elle expliquait les notions et le guidait étape par étape, et il écrivait chaque ligne. Il découvre maintenant le travail avec un agent de code comme Claude Code : il fixe les règles du projet, valide le plan de chaque fonctionnalité, relit et teste chaque modification avant de l'accepter. Ce site en est le premier exemple.

### Que cherche-t-il dans son prochain poste ?

Un premier poste de développeur. Il s'est concentré jusqu'ici sur le développement web et l'intégration de l'IA, mais tout ce qui touche à la programmation l'intéresse. Ce qui compte le plus pour lui, c'est de continuer à progresser, que ce soit au sein d'une équipe expérimentée ou dans une structure plus petite, où il apprend en avançant par lui-même.
