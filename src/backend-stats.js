import si from 'systeminformation';

export const getSystemStats = async (req, res) => {
  try {
    // 1. Dados Básicos (Paralelo para ser rápido)
    const [cpu, mem, disk, osInfo] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo()
    ]);

    // 2. Dados do Docker (Pode falhar se sem permissão, então isolamos)
    let docker = [];
    try {
      docker = await si.dockerContainers();
    } catch (e) {
      console.error("Erro ao ler Docker:", e.message);
    }

    // 3. Filtrar Discos (Remover Snaps e Loops inúteis)
    const cleanDisk = disk.filter(d => 
      !d.fs.includes('loop') && 
      !d.fs.includes('tmpfs') && 
      !d.mount.includes('/snap') &&
      d.size > 1000000000 // Apenas maiores que 1GB
    );

    res.json({
      cpu: {
        load: cpu.currentLoad,
        cores: cpu.cpus.length,
        brand: cpu.brand // Ex: Intel Xeon...
      },
      mem: {
        total: mem.total,
        active: mem.active,
        usedPercent: (mem.active / mem.total) * 100
      },
      disk: cleanDisk,
      docker: docker.map(c => ({
        name: c.name,
        image: c.image,
        state: c.state,
        status: c.status,
        mem_percent: c.mem_percent,
        cpu_percent: c.cpu_percent,
        uptime: c.uptime,
        id: c.id
      })),
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        hostname: osInfo.hostname,
        uptime: os.uptime()
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao ler métricas do servidor' });
  }
};
