#!/usr/bin/env python3
"""
MORPHIC ENGINE — VirtualAPK Integration
STREAM stage now emits Android APK via VirtualAPK pipeline.
"""

from morphic_schema import MorphicEngine, MorphStage
from android_generator import AndroidGenerator, VirtualAPKHostLoader, stream_to_virtualapk
from schema import MeshState

class VirtualAPKMorphicEngine(MorphicEngine):
    """Extended MorphicEngine with VirtualAPK STREAM stage."""

    def __init__(self, mesh: MeshState, output_dir: str = '/tmp/messy-android'):
        super().__init__(mesh)
        self.output_dir = output_dir
        self.android_generator = AndroidGenerator(mesh)

    def stream(self, envelope) -> 'MorphicEnvelope':
        """STREAM stage: Generate Android APK and emit to VirtualAPK."""
        # Generate Android project
        files = self.android_generator.generate()

        # Write files
        import os
        for path, content in files.items():
            full_path = os.path.join(self.output_dir, path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)

        # Write host loader
        host_files = VirtualAPKHostLoader.get_host_files()
        for path, content in host_files.items():
            full_path = os.path.join(self.output_dir, 'host', path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)

        # Add build command to payload
        envelope.payload.append({
            'subject': 'BUILD_SYSTEM',
            'relation': 'GENERATES',
            'object': 'APK',
            'rv': 1.0,
            'h': 1.0,
            'build_command': f'cd {self.output_dir} && ./gradlew assemblePlugin',
            'apk_path': f'{self.output_dir}/build/outputs/plugin/release/plugin-release.apk'
        })

        return envelope.advance(MorphStage.STREAM)

    def run_pipeline_with_apk(self, file_map: dict) -> list:
        """Full pipeline ending with APK generation."""
        env = self.ingest(file_map)
        env = self.relax(env)
        env = self.inflect(env)
        env = self.mutate(env)
        env = self.stream(env)
        env = self.archive(env)
        return self.envelopes

__all__ = ['VirtualAPKMorphicEngine']
