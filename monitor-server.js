import express from 'express';
import cors from 'cors';
import si from 'systeminformation';

const app = express();
app.use(cors());

// ROTA ATUALIZADA (Para evitar conflito com Traccar)
app.get('/api/monitor/stats', async (req, res) => {
  try {
    // 1. DOCKER
    let dockerContainers = [];
    try {
      dockerContainers = await si.dockerContainers();
    } catch (e) {
      console.error("Erro Docker:", e.message);
    }

    // 2. DISCO
    const fsSize = await si.fsSize();
    const disks = fsSize.filter(d => 
      d.size > 2000000000 && 
      !d.fs.includes('loop') && 
      !d.fs.includes('tmpfs') &&
      !d.fs.includes('overlay')
    );

    // 3. CPU e MEM
    const cpuLoad = await si.currentLoad();
    const mem = await si.mem();
    const osInfo = await si.osInfo();
    const time = await si.time();

    res.json({
      cpu: {
        load: cpuLoad.currentLoad || 0,
        cores: cpuLoad.cpus.length
      },
      mem: {
        total: mem.total,
        active: mem.active,
        usedPercent: (mem.active / mem.total) * 100
      },
      disk: disks,
      docker: dockerContainers.map(c => ({
        id: c.id,
        name: c.name,
        image: c.image,
        state: c.state,
        status: c.status,
        mem_percent: c.mem_percent || 0,
        cpu_percent: c.cpu_percent || 0
      })),
      os: {
        distro: osInfo.distro,
        hostname: osInfo.hostname,
        uptime: time.uptime
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, '0.0.0.0', () => {
  console.log('Monitor de Sistema rodando na porta 3002 em /api/monitor/stats');
});
