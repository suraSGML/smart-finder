"""
Management command to backup the PostgreSQL database.
Run: python manage.py backup_db
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from decouple import config
import subprocess
from datetime import datetime
import os


class Command(BaseCommand):
    help = 'Backup the PostgreSQL database to a file'

    def add_arguments(self, parser):
        parser.add_argument('--output', type=str, help='Output file path')
        parser.add_argument('--compress', action='store_true', help='Compress backup with gzip')

    def handle(self, *args, **options):
        db_name = config('DB_NAME', default='smart_finder_db')
        db_user = config('DB_USER', default='postgres')
        db_password = config('DB_PASSWORD', default='postgres')
        db_host = config('DB_HOST', default='localhost')
        db_port = config('DB_PORT', default='5432')

        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = options.get('output') or f'backups/{db_name}_backup_{timestamp}.sql'
        
        # Ensure backup directory exists
        os.makedirs(os.path.dirname(output_file) or '.', exist_ok=True)

        # Set PGPASSWORD environment variable for pg_dump
        env = os.environ.copy()
        env['PGPASSWORD'] = db_password

        # Build pg_dump command
        cmd = [
            'pg_dump',
            f'--host={db_host}',
            f'--port={db_port}',
            f'--username={db_user}',
            f'--dbname={db_name}',
            '--no-password',
            '--format=plain',
            '--verbose',
        ]

        # Add compression if requested
        if options.get('compress'):
            output_file += '.gz'
            cmd.extend(['--compress=9'])

        # Redirect output to file
        with open(output_file, 'wb') as f:
            try:
                subprocess.run(cmd, env=env, stdout=f, check=True)
                self.stdout.write(self.style.SUCCESS(f'Backup created successfully: {output_file}'))
            except subprocess.CalledProcessError as e:
                self.stdout.write(self.style.ERROR(f'Backup failed: {e}'))
            except FileNotFoundError:
                self.stdout.write(self.style.ERROR('pg_dump not found. Make sure PostgreSQL client tools are installed.'))
